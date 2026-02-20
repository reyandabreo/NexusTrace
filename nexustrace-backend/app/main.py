from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.neo4j import neo4j_handler
from app.ai.nlp import load_nlp_model
from app.ai.embeddings import load_embedding_model
from app.auth.router import router as auth_router
from app.cases.router import router as cases_router
from app.ingestion.router import router as evidence_router
from app.rag.router import router as rag_router
from app.feedback.router import router as feedback_router
from app.graph.router import router as graph_router

app = FastAPI(title=settings.APP_NAME, description="Forensic Intelligence Backend")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    print("Starting up NexusTrace...")
    
    # 1. Connect to DB
    try:
        neo4j_handler.connect()
        print("Connected to Neo4j.")
    except Exception as e:
        print(f"Failed to connect to Neo4j: {e}")

    # 2. Load Models
    print("Loading AI Models...")
    load_nlp_model()
    load_embedding_model()
    print("AI Models loaded.")

@app.on_event("shutdown")
async def shutdown_event():
    print("Shutting down...")
    neo4j_handler.close()
    print("Neo4j connection closed.")

# Routers
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(cases_router, prefix="/cases", tags=["Cases"])
app.include_router(evidence_router, prefix="/evidence", tags=["Evidence"])
app.include_router(rag_router, prefix="/rag", tags=["RAG"])
app.include_router(feedback_router, prefix="/feedback", tags=["Feedback"])
app.include_router(graph_router, prefix="/graph", tags=["Graph Analysis"])

@app.get("/")
def read_root():
    return {"message": "Welcome to NexusTrace API"}
