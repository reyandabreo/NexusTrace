import spacy
import re
from app.core.config import settings

nlp_model = None

def load_nlp_model():
    global nlp_model
    if nlp_model is None:
        try:
            nlp_model = spacy.load(settings.SPACY_MODEL)
            print(f"Successfully loaded spaCy model: {settings.SPACY_MODEL}")
        except OSError as e:
            # Fallback or strict error. The user is supposed to download it.
            print(f"ERROR: Model {settings.SPACY_MODEL} not found. Please run 'python -m spacy download {settings.SPACY_MODEL}'")
            print(f"OSError details: {e}")
            return
        except Exception as e:
            print(f"ERROR loading spaCy model: {e}")
            return

def extract_entities(text: str):
    if not nlp_model:
        load_nlp_model()
    
    if not nlp_model:
        print("WARNING: NLP model not loaded. Returning empty entity list.")
        return []

    try:
        doc = nlp_model(text)
        entities = []
        
        # SpaCy entities - expanded to capture more types
        for ent in doc.ents:
            if ent.label_ in ["PERSON", "ORG", "GPE", "DATE", "TIME", "MONEY", "PRODUCT", "EVENT", "LAW", "NORP"]:
                entities.append({"name": ent.text, "type": ent.label_})
        
        # Regex for Emails
        emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
        for email in emails:
            entities.append({"name": email, "type": "EMAIL"})
            
        # Regex for IPs (Simple IPv4)
        ips = re.findall(r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b', text)
        for ip in ips:
            entities.append({"name": ip, "type": "IP_ADDRESS"})
        
        # Regex for URLs
        urls = re.findall(r'https?://(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&/=]*)', text)
        for url in urls:
            entities.append({"name": url, "type": "URL"})
        
        # Regex for phone numbers (simple pattern)
        phones = re.findall(r'\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b', text)
        for phone in phones:
            entities.append({"name": phone, "type": "PHONE"})
        
        print(f"Extracted {len(entities)} entities from text")
        return entities
        
    except Exception as e:
        print(f"ERROR during entity extraction: {e}")
        return []
