# NexusTrace Backend

NexusTrace is a forensic intelligence platform backend built with FastAPI, Neo4j, and OpenAI.

## Features
- **Authentication**: JWT-based user management.
- **Case Management**: Isolated case environments.
- **Evidence Ingestion**: Uploads for PDF, TXT, JSON, CSV with auto-chunking.
- **AI Triage**: Entity extraction (spaCy), anomaly scoring, and embeddings.
- **Graph Storage**: Evidence and chunks linked in Neo4j Knowledge Graph.
- **Hybrid RAG**: Vector search + Graph traversal for retrieval.
- **Traceability**: XAI endpoints to explain RAG answers.

## Requirements
- Python 3.9+
- Neo4j Database
- OpenAI API Key

## Setup

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Download spaCy Model**
   ```bash
   python -m spacy download en_core_web_sm
   ```

3. **Configure Environment**
   Rename `.env.example` to `.env` and fill in your credentials.
   ```
   NEO4J_URI=bolt://localhost:7687
   NEO4J_PASSWORD=your_password
   OPENAI_API_KEY=your_key
   ```

4. **Run Application**
   ```bash
   uvicorn app.main:app --reload
   ```

## API Documentation
Once running, visit `http://localhost:8000/docs` for Swagger UI.
