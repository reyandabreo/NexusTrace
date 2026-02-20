from sentence_transformers import SentenceTransformer
from app.core.config import settings

embedding_model = None

def load_embedding_model():
    global embedding_model
    if embedding_model is None:
        print(f"DEBUG: Loading embedding model: {settings.EMBEDDING_MODEL}")
        embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL)
        print("DEBUG: Embedding model loaded successfully")

def get_embedding(text: str):
    if not embedding_model:
        load_embedding_model()
    
    # Encode returns numpy array, convert to list
    embedding = embedding_model.encode(text).tolist()
    print(f"DEBUG: Generated embedding of length {len(embedding)} for text: {text[:50]}...")
    return embedding
