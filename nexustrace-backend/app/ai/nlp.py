import re
from app.core.config import settings

nlp_model = None
_spacy_module = None
_spacy_import_error = None


def _get_spacy_module():
    global _spacy_module, _spacy_import_error

    if _spacy_module is not None:
        return _spacy_module

    if _spacy_import_error is not None:
        return None

    try:
        import spacy

        _spacy_module = spacy
    except Exception as e:
        _spacy_import_error = e
        print("WARNING: spaCy could not be imported. Falling back to regex-only entity extraction.")
        print(f"spaCy import details: {e}")
        return None

    return _spacy_module


def _extract_regex_entities(text: str):
    entities = []

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

    return entities

def load_nlp_model():
    global nlp_model

    if nlp_model is None:
        spacy = _get_spacy_module()
        if spacy is None:
            return

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
    entities = _extract_regex_entities(text)

    if not nlp_model:
        load_nlp_model()

    if nlp_model:
        try:
            doc = nlp_model(text)

            # SpaCy entities - expanded to capture more types
            for ent in doc.ents:
                if ent.label_ in ["PERSON", "ORG", "GPE", "DATE", "TIME", "MONEY", "PRODUCT", "EVENT", "LAW", "NORP"]:
                    entities.append({"name": ent.text, "type": ent.label_})
        except Exception as e:
            print(f"ERROR during spaCy entity extraction: {e}")

    print(f"Extracted {len(entities)} entities from text")
    return entities
