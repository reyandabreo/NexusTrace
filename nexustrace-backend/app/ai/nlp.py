import spacy
import re
from app.core.config import settings

nlp_model = None

def load_nlp_model():
    global nlp_model
    if nlp_model is None:
        try:
            nlp_model = spacy.load(settings.SPACY_MODEL)
        except OSError:
            # Fallback or strict error. The user is supposed to download it.
            print(f"Warning: Model {settings.SPACY_MODEL} not found. Please run 'python -m spacy download {settings.SPACY_MODEL}'")
            return

def extract_entities(text: str):
    if not nlp_model:
        load_nlp_model()
    
    if not nlp_model:
        return []

    doc = nlp_model(text)
    entities = []
    
    # SpaCy entities
    for ent in doc.ents:
        if ent.label_ in ["PERSON", "ORG", "GPE", "DATE"]:
            entities.append({"name": ent.text, "type": ent.label_})
    
    # Regex for Emails
    emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
    for email in emails:
        entities.append({"name": email, "type": "EMAIL"})
        
    # Regex for IPs (Simple IPv4)
    ips = re.findall(r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b', text)
    for ip in ips:
        entities.append({"name": ip, "type": "IP_ADDRESS"})

    return entities
