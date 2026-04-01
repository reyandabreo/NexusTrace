from neo4j import Session
from fastapi import HTTPException, status
from email.message import EmailMessage
import hashlib
import secrets
import smtplib
import ssl
import time
import certifi
import requests
import uuid
from app.core.config import settings
from app.core.security import get_password_hash, verify_password, create_access_token
from app.schemas.user import UserCreate, UserLogin, Token

class AuthService:
    def __init__(self, session: Session):
        self.session = session

    def _hash_reset_token(self, token: str) -> str:
        digest = hashlib.sha256()
        digest.update(f"{token}{settings.SECRET_KEY}".encode("utf-8"))
        return digest.hexdigest()

    def _send_mailersend_email(self, to_email: str, subject: str, text_body: str) -> bool:
        if not settings.MAILERSEND_API_KEY:
            return False
        if not settings.SMTP_FROM_EMAIL:
            print("DEBUG: SMTP_FROM_EMAIL not configured. Skipping MailerSend email.")
            return False

        try:
            response = requests.post(
                "https://api.mailersend.com/v1/email",
                headers={
                    "Authorization": f"Bearer {settings.MAILERSEND_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": {
                        "email": settings.SMTP_FROM_EMAIL,
                        "name": settings.SMTP_FROM_NAME,
                    },
                    "to": [{"email": to_email}],
                    "subject": subject,
                    "text": text_body,
                },
                timeout=10,
            )
            if response.status_code in (200, 202):
                return True
            print("DEBUG: MailerSend API error", response.status_code, response.text)
        except Exception as e:
            print(f"DEBUG: Failed to send reset email via MailerSend: {e}")

        return False

    def _send_reset_email(self, to_email: str, reset_link: str, username: str = ""):
        greeting = f"Hi {username}," if username else "Hi,"
        message = EmailMessage()
        message["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        message["To"] = to_email
        message["Subject"] = "Reset your NexusTrace password"
        message.set_content(
            f"{greeting}\n\n"
            "We received a request to reset your NexusTrace password. "
            "Use the link below to set a new password:\n\n"
            f"{reset_link}\n\n"
            "If you did not request this, you can ignore this email."
        )

        provider = (settings.EMAIL_PROVIDER or "auto").strip().lower()
        if provider in ("ssl", "starttls"):
            provider = "smtp"
        if provider not in ("auto", "sendgrid", "smtp", "mailersend"):
            provider = "auto"

        if provider in ("mailersend", "auto"):
            if self._send_mailersend_email(to_email, message["Subject"], message.get_content()):
                return
            if provider == "mailersend":
                return

        if provider in ("sendgrid", "auto") and settings.SENDGRID_API_KEY:
            if not settings.SMTP_FROM_EMAIL:
                print("DEBUG: SMTP_FROM_EMAIL not configured. Skipping reset email.")
                return
            try:
                response = requests.post(
                    "https://api.sendgrid.com/v3/mail/send",
                    headers={
                        "Authorization": f"Bearer {settings.SENDGRID_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "personalizations": [
                            {"to": [{"email": to_email}]}
                        ],
                        "from": {
                            "email": settings.SMTP_FROM_EMAIL,
                            "name": settings.SMTP_FROM_NAME,
                        },
                        "subject": message["Subject"],
                        "content": [
                            {"type": "text/plain", "value": message.get_content()}
                        ],
                    },
                    timeout=10,
                )
                if response.status_code in (200, 202):
                    return
                print(
                    "DEBUG: SendGrid API error",
                    response.status_code,
                    response.text,
                )
                if provider == "sendgrid":
                    return
            except Exception as e:
                print(f"DEBUG: Failed to send reset email via SendGrid: {e}")
                if provider == "sendgrid":
                    return

        if provider == "sendgrid":
            print("DEBUG: SendGrid API key missing. Skipping reset email.")
            return

        if provider == "mailersend":
            print("DEBUG: MailerSend API key missing. Skipping reset email.")
            return

        if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASS or not settings.SMTP_FROM_EMAIL:
            print("DEBUG: SMTP not configured. Skipping reset email.")
            return

        context = ssl.create_default_context(cafile=certifi.where())

        try:
            if settings.SMTP_PORT == 465:
                with smtplib.SMTP_SSL(
                    settings.SMTP_HOST,
                    settings.SMTP_PORT,
                    timeout=10,
                    context=context
                ) as smtp:
                    smtp.ehlo()
                    smtp.login(settings.SMTP_USER, settings.SMTP_PASS)
                    smtp.send_message(message)
            else:
                with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as smtp:
                    smtp.ehlo()
                    if smtp.has_extn("starttls"):
                        smtp.starttls(context=context)
                        smtp.ehlo()
                    smtp.login(settings.SMTP_USER, settings.SMTP_PASS)
                    smtp.send_message(message)
        except smtplib.SMTPAuthenticationError as e:
            print(
                "DEBUG: SMTP authentication failed. Check SMTP_USER/SMTP_PASS.",
                f"code={getattr(e, 'smtp_code', None)}",
                f"error={getattr(e, 'smtp_error', None)}",
            )
        except smtplib.SMTPSenderRefused as e:
            print(
                "DEBUG: SMTP sender refused. Verify SMTP_FROM_EMAIL is authenticated.",
                f"code={getattr(e, 'smtp_code', None)}",
                f"error={getattr(e, 'smtp_error', None)}",
            )
        except smtplib.SMTPRecipientsRefused as e:
            print("DEBUG: SMTP recipient refused.", f"recipients={list(e.recipients.keys())}")
        except smtplib.SMTPServerDisconnected as e:
            print("DEBUG: SMTP server disconnected. Check SMTP host/port or network rules.")
            print(f"DEBUG: Failed to send reset email: {e}")
        except smtplib.SMTPResponseException as e:
            print(
                "DEBUG: SMTP error.",
                f"code={getattr(e, 'smtp_code', None)}",
                f"error={getattr(e, 'smtp_error', None)}",
            )
        except Exception as e:
            print(f"DEBUG: Failed to send reset email: {e}")

    def register_user(self, user: UserCreate):
        # Check if user exists
        query_check = "MATCH (u:User {username: $username}) RETURN u"
        result = self.session.run(query_check, username=user.username).single()
        
        if result:
            raise HTTPException(status_code=400, detail="Username already registered")

        # Create user
        user_id = str(uuid.uuid4())
        hashed_password = get_password_hash(user.password)
        query_create = """
        CREATE (u:User {
            id: $user_id,
            username: $username, 
            email: $email, 
            password_hash: $password_hash,
            token_version: 0,
            created_at: timestamp()
        })
        RETURN u.username as username, u.email as email, u.id as id
        """
        self.session.run(query_create, 
                         user_id=user_id,
                         username=user.username, 
                         email=user.email, 
                         password_hash=hashed_password)
        
        return {"username": user.username, "email": user.email, "id": user_id}

    def login_user(self, user: UserLogin):
        query = """
        MATCH (u:User {username: $username})
        RETURN u.username as username,
               u.password_hash as password_hash,
               u.id as user_id,
               u.role as role,
               coalesce(u.token_version, 0) as token_version
        """
        result = self.session.run(query, username=user.username).single()

        if not result or not verify_password(user.password, result["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Include user_id and role in the token
        access_token = create_access_token(data={
            "sub": user.username,
            "user_id": result["user_id"],
            "role": result.get("role", "user"), # Default to user if role not set
            "token_version": result.get("token_version", 0)
        })
        return {"access_token": access_token, "token_type": "bearer"}

    def request_password_reset(self, identifier: str):
        if not identifier or not identifier.strip():
            return {"status": "ok"}

        query = """
        MATCH (u:User)
        WHERE toLower(u.username) = toLower($identifier)
            OR toLower(u.email) = toLower($identifier)
        RETURN u.id as user_id, u.email as email, u.username as username
        LIMIT 1
        """
        result = self.session.run(query, identifier=identifier.strip()).single()
        if not result:
            return {"status": "ok"}

        token = secrets.token_urlsafe(32)
        token_hash = self._hash_reset_token(token)
        expires_at = int(time.time() * 1000) + (settings.PASSWORD_RESET_TOKEN_TTL_MINUTES * 60 * 1000)

        update_query = """
        MATCH (u:User {id: $user_id})
        SET u.reset_token_hash = $token_hash,
            u.reset_token_expires_at = $expires_at,
            u.reset_token_created_at = timestamp()
        RETURN u.id as id
        """
        self.session.run(
            update_query,
            user_id=result["user_id"],
            token_hash=token_hash,
            expires_at=expires_at,
        )

        base_url = settings.FRONTEND_URL.rstrip("/")
        reset_link = f"{base_url}/reset-password?token={token}"

        if result.get("email"):
            self._send_reset_email(result["email"], reset_link, result.get("username"))

        if settings.APP_ENV == "development":
            return {"status": "ok", "reset_token": token}
        return {"status": "ok"}

    def reset_password(self, token: str, new_password: str):
        if not token or not token.strip():
            raise HTTPException(status_code=400, detail="Reset token is required")
        if not new_password or len(new_password) < 8:
            raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

        token_hash = self._hash_reset_token(token.strip())
        now_ms = int(time.time() * 1000)

        query = """
        MATCH (u:User {reset_token_hash: $token_hash})
        WHERE u.reset_token_expires_at >= $now_ms
        RETURN u.id as user_id, coalesce(u.token_version, 0) as token_version
        """
        result = self.session.run(query, token_hash=token_hash, now_ms=now_ms).single()
        if not result:
            raise HTTPException(status_code=400, detail="Reset token is invalid or expired")

        new_hash = get_password_hash(new_password)
        new_version = int(result["token_version"] or 0) + 1
        update_query = """
        MATCH (u:User {id: $user_id})
        SET u.password_hash = $password_hash,
            u.token_version = $token_version,
            u.reset_token_hash = null,
            u.reset_token_expires_at = null,
            u.reset_token_created_at = null
        RETURN u.id as id
        """
        self.session.run(
            update_query,
            user_id=result["user_id"],
            password_hash=new_hash,
            token_version=new_version,
        )

        return {"status": "ok"}

    def change_password(self, user_id: str, current_password: str, new_password: str):
        query = """
        MATCH (u:User {id: $user_id})
        RETURN u.password_hash as password_hash,
               coalesce(u.token_version, 0) as token_version
        """
        result = self.session.run(query, user_id=user_id).single()
        if not result:
            raise HTTPException(status_code=404, detail="User not found")

        if not verify_password(current_password, result["password_hash"]):
            raise HTTPException(status_code=400, detail="Current password is incorrect")

        new_hash = get_password_hash(new_password)
        new_version = int(result["token_version"] or 0) + 1
        update_query = """
        MATCH (u:User {id: $user_id})
        SET u.password_hash = $password_hash,
            u.token_version = $token_version
        RETURN u.id as id
        """
        self.session.run(
            update_query,
            user_id=user_id,
            password_hash=new_hash,
            token_version=new_version,
        )
        return {"status": "ok"}

    def logout_all_sessions(self, user_id: str):
        query = """
        MATCH (u:User {id: $user_id})
        SET u.token_version = coalesce(u.token_version, 0) + 1
        RETURN u.token_version as token_version
        """
        result = self.session.run(query, user_id=user_id).single()
        if not result:
            raise HTTPException(status_code=404, detail="User not found")
        return {"status": "ok"}

    def get_me(self, user_id: str):
        query = "MATCH (u:User {id: $user_id}) RETURN u.username as username, u.email as email, u.id as id"
        result = self.session.run(query, user_id=user_id).single()
        if not result:
            raise HTTPException(status_code=404, detail="User not found")
        return {"username": result["username"], "email": result["email"], "id": result["id"]}
