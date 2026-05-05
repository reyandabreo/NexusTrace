import json
import logging
from typing import Any, Dict, List, Optional

import requests
from openai import OpenAI

from app.core.config import settings


logger = logging.getLogger(__name__)


class Generator:
    def __init__(self):
        self.openai_client: Optional[OpenAI] = None
        if settings.OPENAI_API_KEY:
            if settings.OPENAI_API_KEY.startswith("sk-or-"):
                self.openai_client = OpenAI(
                    api_key=settings.OPENAI_API_KEY,
                    base_url="https://openrouter.ai/api/v1",
                )
            else:
                self.openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)

    def _normalize_provider(self, provider: Optional[str]) -> str:
        value = (provider or "auto").strip().lower()
        if value in {"auto", "openai", "gemini"}:
            return value
        return "auto"

    def _provider_order(self, requested: str) -> List[str]:
        available: List[str] = []
        if settings.GEMINI_API_KEY and getattr(settings, "GEMINI_MODEL", ""):
            available.append("gemini")
        if self.openai_client and settings.OPENAI_MODEL:
            available.append("openai")

        if not available:
            raise RuntimeError("No configured text-generation providers")

        if requested == "auto":
            return available

        order: List[str] = []
        if requested in available:
            order.append(requested)
        for candidate in available:
            if candidate not in order:
                order.append(candidate)
        return order

    def _extract_json_text(self, content: str) -> Dict[str, Any]:
        cleaned = content.strip()

        if cleaned.startswith("```json"):
            cleaned = cleaned.replace("```json", "", 1).rsplit("```", 1)[0].strip()
        elif cleaned.startswith("```"):
            cleaned = cleaned.replace("```", "", 1).rsplit("```", 1)[0].strip()

        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            start = cleaned.find("{")
            end = cleaned.rfind("}")
            if start >= 0 and end > start:
                return json.loads(cleaned[start : end + 1])
            raise

    def _build_system_prompt(self) -> str:
        system_prompt = """
        You are a forensic intelligence assistant. 
        Answer the user's question based ONLY on the provided context from evidence documents.
        
        IMPORTANT RULES:
        1. Cite the specific source files in your answer using the format [Source: filename]. 
        2. If a page number is available, cite as [Source: filename, Page N].
        3. You MUST verify your answer by referencing the exact source documents.
        4. If the answer cannot be determined from the context, say "Insufficient data in the uploaded evidence."
        5. If the conversation history is provided, use it for context continuity but always ground answers in the evidence.
        
        Return your response in the following JSON format:
        {
            "answer": "Your comprehensive answer here with [Source: filename] citations inline",
            "cited_chunks": ["chunk_id_1", "chunk_id_2"],
            "reasoning_summary": "Brief explanation of how you derived the answer from the sources",
            "confidence_score": 0.0 to 1.0,
            "sources_used": ["filename1.pdf", "filename2.csv"]
        }
        """
        return system_prompt

    def _build_messages(
        self,
        question: str,
        context: str,
        chat_history: Optional[List[Dict[str, str]]] = None,
    ) -> List[Dict[str, str]]:
        system_prompt = self._build_system_prompt()
        messages = [{"role": "system", "content": system_prompt}]

        # Add conversation history for context continuity
        if chat_history:
            for msg in chat_history[-6:]:  # Last 3 turns (6 messages)
                messages.append({"role": msg["role"], "content": msg["content"]})

        user_message = f"Question: {question}\n\nEvidence Context:\n{context}"
        messages.append({"role": "user", "content": user_message})

        return messages

    def _generate_with_openai(self, messages: List[Dict[str, str]]) -> str:
        if not self.openai_client:
            raise RuntimeError("OpenAI provider is not configured")

        response = self.openai_client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=messages,
            temperature=0.0,
        )

        content = response.choices[0].message.content
        if not content:
            raise RuntimeError("OpenAI returned empty content")
        return content

    def _to_gemini_contents(self, messages: List[Dict[str, str]]) -> List[Dict[str, Any]]:
        contents: List[Dict[str, Any]] = []
        for msg in messages:
            role = msg.get("role", "user")
            if role == "system":
                continue
            gemini_role = "model" if role == "assistant" else "user"
            contents.append(
                {
                    "role": gemini_role,
                    "parts": [{"text": msg.get("content", "")}],
                }
            )
        return contents

    def _extract_gemini_text(self, payload: Dict[str, Any]) -> str:
        candidates = payload.get("candidates") or []
        for candidate in candidates:
            content = candidate.get("content") or {}
            parts = content.get("parts") or []
            for part in parts:
                text = part.get("text")
                if text:
                    return text
        raise RuntimeError("Gemini returned no text content")

    def _generate_with_gemini(self, messages: List[Dict[str, str]]) -> str:
        if not settings.GEMINI_API_KEY:
            raise RuntimeError("Gemini provider is not configured")

        system_message = next((m["content"] for m in messages if m.get("role") == "system"), "")
        contents = self._to_gemini_contents(messages)

        endpoint = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{settings.GEMINI_MODEL}:generateContent"
        )
        payload: Dict[str, Any] = {
            "contents": contents,
            "generationConfig": {
                "temperature": 0,
                "responseMimeType": "application/json",
            },
        }

        if system_message:
            payload["systemInstruction"] = {
                "parts": [{"text": system_message}],
            }

        response = requests.post(
            endpoint,
            params={"key": settings.GEMINI_API_KEY},
            json=payload,
            timeout=120,
        )

        if response.status_code >= 400:
            body = response.text[:500]
            raise RuntimeError(f"Gemini API error ({response.status_code}): {body}")

        return self._extract_gemini_text(response.json())

    def generate_answer(
        self,
        question: str,
        context: str,
        chat_history: Optional[List[Dict[str, str]]] = None,
        provider: str = "auto",
    ):
        requested_provider = self._normalize_provider(provider)
        messages = self._build_messages(question, context, chat_history=chat_history)
        try:
            provider_order = self._provider_order(requested_provider)
        except Exception as e:
            return {
                "answer": "Error processing request.",
                "cited_chunks": [],
                "reasoning_summary": str(e),
                "confidence_score": 0.0,
                "sources_used": [],
                "provider_requested": requested_provider,
                "provider_used": "none",
            }

        errors: List[str] = []

        for provider_name in provider_order:
            try:
                if provider_name == "openai":
                    content = self._generate_with_openai(messages)
                elif provider_name == "gemini":
                    content = self._generate_with_gemini(messages)
                else:
                    raise RuntimeError("Unsupported provider")

                parsed = self._extract_json_text(content)
                if "sources_used" not in parsed:
                    parsed["sources_used"] = []

                parsed["provider_requested"] = requested_provider
                parsed["provider_used"] = provider_name
                return parsed
            except Exception as e:
                logger.exception("RAG generation failed for provider %s", provider_name)
                errors.append(f"{provider_name}: {e}")

        error_summary = " ; ".join(errors) if errors else "Unknown generation failure"
        return {
            "answer": "Error processing request.",
            "cited_chunks": [],
            "reasoning_summary": error_summary,
            "confidence_score": 0.0,
            "sources_used": [],
            "provider_requested": requested_provider,
            "provider_used": "none",
        }
