# 🔍 NexusTrace Backend

**NexusTrace** is an advanced forensic intelligence platform backend that leverages AI, graph databases, and retrieval-augmented generation (RAG) to help investigators analyze digital evidence, extract actionable insights, and build temporal forensic timelines.

Built with **FastAPI**, **Neo4j Graph Database**, and **OpenAI**, NexusTrace provides intelligent evidence processing, entity extraction, risk scoring, and explainable AI for forensic investigations.

---

## 📚 Table of Contents

- [🎯 Overview](#-overview)
- [✨ Key Features](#-key-features)
- [🏗️ System Architecture](#️-system-architecture)
- [🛠️ Tech Stack](#️-tech-stack)
- [📋 Prerequisites](#-prerequisites)
- [🚀 Installation & Setup](#-installation--setup)
- [📁 Project Structure](#-project-structure)
- [⚙️ How It Works](#️-how-it-works)
- [🔌 API Endpoints](#-api-endpoints)
- [🤝 Contributing](#-contributing)
- [💻 Development Guidelines](#-development-guidelines)
- [🧪 Testing](#-testing)
- [🐛 Troubleshooting](#-troubleshooting)

---

## 🎯 Overview

NexusTrace is designed for digital forensic investigators who need to:
- Process and analyze large volumes of digital evidence (logs, documents, CSV, JSON)
- Extract entities and relationships automatically using NLP
- Build knowledge graphs connecting evidence, entities, and events
- Query evidence using natural language (RAG-powered Q&A)
- Generate temporal timelines of events
- Identify high-priority leads based on risk scoring
- Maintain explainability and traceability for court-ready reports

### Who Is This For?
- **Forensic Investigators**: Analyze digital evidence efficiently
- **Security Analysts**: Investigate security incidents
- **Researchers**: Study forensic AI and graph-based analysis
- **Developers**: Build forensic tools and contribute to open-source

---

## ✨ Key Features

### 🔐 **Authentication & Authorization**
- JWT-based secure authentication
- User-specific case isolation
- Role-based access control (planned)

### 🗂️ **Case Management**
- Create and manage isolated investigation cases
- Multi-user support with access controls
- Case-specific evidence and query history

### 📄 **Evidence Ingestion**
- **Supported formats**: PDF, TXT, JSON, CSV
- **Smart chunking**: Semantic text chunking with overlap for context preservation
- **Timestamp extraction**: 7+ timestamp format detection (ISO 8601, Apache logs, syslog, etc.)
- **Metadata extraction**: File type, upload date, source attribution

### 🤖 **AI-Powered Triage**
- **Entity Extraction**: Named Entity Recognition using spaCy (people, organizations, locations, emails, IPs)
- **Risk Scoring**: Automatic anomaly detection and risk assessment per chunk
- **Embeddings**: Sentence-Transformers for semantic search (`all-MiniLM-L6-v2`)
- **OpenAI Integration**: GPT-4o-mini for answer generation

### 🕸️ **Knowledge Graph**
- **Neo4j Graph Database**: Entities, evidence, chunks, and relationships
- **Graph relationships**: `HAS_EVIDENCE`, `HAS_CHUNK`, `MENTIONS`, `RETRIEVED`, etc.
- **Entity linking**: Automatic connection of entities across multiple evidence files

### 🔍 **Hybrid RAG (Retrieval-Augmented Generation)**
- **Vector Search**: Semantic similarity search using embeddings
- **Graph Traversal**: Context-aware retrieval using knowledge graph relationships
- **Context Building**: Intelligent context assembly from retrieved chunks
- **Answer Generation**: Natural language answers with citations
- **Query Logging**: Full traceability of retrieved chunks and reasoning

### 📊 **Timeline Generation**
- **Automatic Event Classification**: 17+ event types (Login, File Access, Email Sent, etc.)
- **Chronological Ordering**: ISO 8601 timestamp-based sorting
- **Risk-Aware**: Events include risk scores for prioritization
- **Entity Linking**: Events show mentioned entities for correlation

### 🎯 **Prioritized Leads**
- **Risk-Based Ranking**: Entities ranked by risk score
- **Connection Analysis**: Graph connectivity metrics
- **Pattern Detection**: Failed logins, sensitive access, data transfers
- **Auto-Reasoning**: Intelligent explanations for each lead

### 🧠 **Explainable AI (XAI)**
- **Citation Tracking**: All answers cite source chunks
- **Reasoning Summaries**: Transparent decision-making process
- **Query History**: Full audit trail of questions and retrievals

### 💬 **Feedback Loop**
- **User Feedback**: Rate and comment on RAG answers
- **Continuous Improvement**: Feedback stored for model fine-tuning

---

## 🏗️ System Architecture

```
┌──────────────┐
│   FastAPI    │  ← REST API Layer
│   Backend    │
└──────┬───────┘
       │
       ├─────────────────┬──────────────────┬─────────────────┐
       │                 │                  │                 │
   ┌───▼────┐      ┌────▼─────┐      ┌────▼─────┐     ┌────▼─────┐
   │  Auth  │      │  Cases   │      │Evidence  │     │   RAG    │
   │ Module │      │  Module  │      │Ingestion │     │  Module  │
   └────────┘      └──────────┘      └────┬─────┘     └────┬─────┘
                                          │                  │
                         ┌────────────────┴──────────────────┘
                         │
                    ┌────▼─────┐
                    │    AI    │  ← NLP, Embeddings, Risk Scoring
                    │  Engine  │
                    └────┬─────┘
                         │
                    ┌────▼─────┐
                    │  Neo4j   │  ← Knowledge Graph Storage
                    │   DB     │
                    └──────────┘
```

### Core Modules

1. **`app/auth`**: User registration, login, JWT token management
2. **`app/cases`**: Case CRUD operations
3. **`app/ingestion`**: File parsing, chunking, evidence processing
4. **`app/ai`**: NLP entity extraction, embeddings, risk scoring
5. **`app/graph`**: Graph builder, timeline generation, lead prioritization
6. **`app/rag`**: Retriever, context builder, answer generator
7. **`app/feedback`**: User feedback collection
8. **`app/core`**: Configuration, security utilities
9. **`app/db`**: Neo4j connection handler
10. **`app/schemas`**: Pydantic models for request/response validation

---

## 🛠️ Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Framework** | FastAPI | High-performance async REST API |
| **Database** | Neo4j | Graph database for knowledge graph |
| **AI/ML** | OpenAI GPT-4o-mini | Answer generation |
| **NLP** | spaCy (`en_core_web_sm`) | Named Entity Recognition |
| **Embeddings** | Sentence-Transformers | Semantic similarity search |
| **Auth** | python-jose, passlib | JWT tokens, password hashing |
| **File Parsing** | PyPDF, python-multipart | PDF and multi-format support |
| **Config** | pydantic-settings, python-dotenv | Environment management |

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Python**: 3.9 or higher ([Download](https://www.python.org/downloads/))
- **Neo4j**: Community or Desktop ([Download](https://neo4j.com/download/))
- **OpenAI API Key**: [Get one here](https://platform.openai.com/api-keys)
- **pip**: Python package manager (usually comes with Python)
- **Git**: Version control (optional but recommended)

### System Requirements
- **Memory**: 4GB RAM minimum (8GB recommended)
- **Storage**: 2GB for dependencies and models
- **OS**: Linux, macOS, or Windows with WSL

---

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/nexustrace.git
cd nexustrace-backend
```

### 2. Create Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Download spaCy Language Model

```bash
python -m spacy download en_core_web_sm
```

### 5. Set Up Neo4j

**Option A: Neo4j Desktop**
1. Download and install [Neo4j Desktop](https://neo4j.com/download/)
2. Create a new database (Project → Add → Local DBMS)
3. Set password (e.g., `password123`)
4. Start the database

**Option B: Docker**
```bash
docker run \
  --name neo4j \
  -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/password123 \
  -d neo4j:latest
```

### 6. Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Application
APP_NAME=NexusTrace
APP_ENV=development

# Security
SECRET_KEY=your-super-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_HOURS=8

# Neo4j
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password123

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4o-mini

# AI Models
EMBEDDING_MODEL=all-MiniLM-L6-v2
SPACY_MODEL=en_core_web_sm

# Chunking
MAX_CHUNK_TOKENS=600
CHUNK_OVERLAP=100
TOP_K_RETRIEVAL=5
```

**Security Note**: Never commit `.env` to version control. Use `.env.example` as a template.

### 7. Run the Application

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## 📁 Project Structure

```
nexustrace-backend/
│
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI application entry point
│   │
│   ├── auth/                      # Authentication module
│   │   ├── models.py              # User models
│   │   ├── router.py              # Auth endpoints
│   │   └── service.py             # Auth business logic
│   │
│   ├── cases/                     # Case management
│   │   ├── models.py              # Case models
│   │   ├── router.py              # Case endpoints
│   │   └── service.py             # Case CRUD operations
│   │
│   ├── ingestion/                 # Evidence processing
│   │   ├── parsers.py             # File parsers (PDF, CSV, JSON, TXT)
│   │   ├── chunker.py             # Text chunking & timestamp extraction
│   │   ├── router.py              # Upload endpoints
│   │   └── service.py             # Ingestion pipeline
│   │
│   ├── ai/                        # AI/ML components
│   │   ├── nlp.py                 # spaCy entity extraction
│   │   ├── embeddings.py          # Sentence-Transformers
│   │   └── metadata.py            # Risk scoring algorithms
│   │
│   ├── graph/                     # Knowledge graph
│   │   ├── builder.py             # Graph node/relationship creation
│   │   ├── timeline.py            # Timeline & lead prioritization
│   │   └── router.py              # Graph endpoints
│   │
│   ├── rag/                       # RAG system
│   │   ├── retriever.py           # Vector + graph retrieval
│   │   ├── context_builder.py    # Context assembly
│   │   ├── generator.py           # OpenAI answer generation
│   │   ├── router.py              # RAG endpoints
│   │   └── service.py             # RAG orchestration
│   │
│   ├── feedback/                  # User feedback
│   │   ├── router.py              # Feedback endpoints
│   │   └── service.py             # Feedback storage
│   │
│   ├── schemas/                   # Pydantic schemas
│   │   ├── user.py                # User request/response models
│   │   ├── case.py                # Case models
│   │   ├── evidence.py            # Evidence models
│   │   ├── rag.py                 # RAG models
│   │   ├── graph.py               # Graph/timeline models
│   │   └── feedback.py            # Feedback models
│   │
│   ├── core/                      # Core utilities
│   │   ├── config.py              # Settings management
│   │   └── security.py            # JWT, password hashing
│   │
│   └── db/                        # Database
│       └── neo4j.py               # Neo4j connection handler
│
├── logs/                          # Application logs
├── models/                        # Downloaded AI models (spaCy, etc.)
├── requirements.txt               # Python dependencies
├── .env                           # Environment variables (DO NOT COMMIT)
├── .env.example                   # Template for .env
└── README.md                      # This file
```

---

## ⚙️ How It Works

### 1. **Evidence Ingestion Pipeline**

```
Upload File → Parse → Chunk → Extract Entities → Calculate Risk → Embed → Store in Graph
```

**Step-by-step**:
1. User uploads evidence file (PDF/TXT/JSON/CSV)
2. `parsers.py` extracts raw text based on file type
3. `chunker.py` splits text into semantic chunks with timestamp detection
4. `nlp.py` extracts entities (people, organizations, emails, IPs)
5. `metadata.py` calculates risk score based on keywords and patterns
6. `embeddings.py` generates vector embeddings for semantic search
7. `builder.py` creates nodes (`Evidence`, `Chunk`, `Entity`) and relationships in Neo4j

### 2. **RAG Query Pipeline**

```
User Question → Embed Query → Retrieve Chunks → Build Context → Generate Answer → Return with Citations
```

**Step-by-step**:
1. User asks a question about the case
2. Question is embedded using same model as chunks
3. `retriever.py` performs:
   - **Vector search**: Find semantically similar chunks
   - **Graph traversal**: Expand context using relationships
4. `context_builder.py` assembles retrieved chunks into coherent context
5. `generator.py` sends context + question to OpenAI GPT-4o-mini
6. Answer is generated with:
   - **Cited chunks**: Source attribution
   - **Reasoning summary**: Explanation of how answer was derived
7. Query, answer, and retrieved chunks logged to Neo4j for XAI

### 3. **Timeline Generation**

```
Fetch Chunks with Timestamps → Classify Event Types → Extract Entities → Calculate Risk → Sort by Time
```

**Features**:
- Auto-detects 17+ event types (Login, File Access, Email Sent, etc.)
- Includes entity mentions for each event
- Risk scores for prioritization
- ISO 8601 timestamp formatting

### 4. **Lead Prioritization**

```
Extract Entities → Count Mentions → Analyze Connections → Detect Patterns → Calculate Risk → Generate Reasons
```

**Risk Factors**:
- Mention frequency across evidence
- Graph connectivity (number of related entities)
- Suspicious patterns (failed logins, sensitive access, data transfers)
- Average risk score of associated chunks

---

## 🔌 API Endpoints

### 🔐 Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login and get JWT token |

### 🗂️ Cases

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/cases/` | Create new case |
| GET | `/cases/` | List all user's cases |
| GET | `/cases/{case_id}` | Get case details |
| DELETE | `/cases/{case_id}` | Delete case |

### 📄 Evidence

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/evidence/upload` | Upload evidence file |
| GET | `/evidence/{evidence_id}` | Get evidence metadata |
| GET | `/evidence/case/{case_id}` | List all evidence for case |

### 🔍 RAG (Question Answering)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/rag/ask` | Ask question about case |
| GET | `/rag/explain/{query_id}` | Get explanation for past query |
| GET | `/rag/history/{case_id}` | Get query history for case |

### 📊 Graph Analysis

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/graph/timeline/{case_id}` | Get chronological timeline |
| GET | `/graph/prioritized/{case_id}` | Get prioritized leads |
| GET | `/graph/entities/{case_id}` | Get all entities in case |

### 💬 Feedback

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/feedback/` | Submit feedback on RAG answer |
| GET | `/feedback/{query_id}` | Get feedback for query |

**Full API documentation**: http://localhost:8000/docs

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Types of Contributions

- 🐛 **Bug Fixes**: Fix issues in existing code
- ✨ **New Features**: Add new capabilities
- 📚 **Documentation**: Improve docs, add examples
- 🧪 **Tests**: Add unit tests, integration tests
- 🎨 **Code Quality**: Refactoring, performance improvements
- 🌍 **Localization**: Add support for other languages

### Getting Started

1. **Fork the Repository**: Click "Fork" on GitHub
2. **Create a Branch**: `git checkout -b feature/your-feature-name`
3. **Make Changes**: Follow development guidelines below
4. **Commit**: `git commit -m "Add: your feature description"`
5. **Push**: `git push origin feature/your-feature-name`
6. **Open Pull Request**: Submit PR with detailed description

### Contribution Workflow

1. **Check Issues**: Look for existing issues or create one
2. **Discuss**: Comment on issue before starting work
3. **Code**: Implement your changes
4. **Test**: Ensure all tests pass
5. **Document**: Update docs if needed
6. **PR**: Submit pull request referencing issue number

---

## 💻 Development Guidelines

### Code Style

- **Python**: Follow [PEP 8](https://peps.python.org/pep-0008/)
- **Formatting**: Use `black` for code formatting
  ```bash
  pip install black
  black app/
  ```
- **Linting**: Use `flake8` or `pylint`
  ```bash
  pip install flake8
  flake8 app/
  ```
- **Type Hints**: Use type annotations
  ```python
  def process_evidence(file: UploadFile) -> Dict[str, Any]:
      ...
  ```

### Best Practices

1. **Separation of Concerns**
   - `router.py`: HTTP request handling only
   - `service.py`: Business logic
   - `models.py`: Data models
   - `schemas/`: Pydantic validation schemas

2. **Error Handling**
   ```python
   from fastapi import HTTPException
   
   if not result:
       raise HTTPException(status_code=404, detail="Resource not found")
   ```

3. **Async/Await** (when applicable)
   ```python
   async def process_file(file: UploadFile):
       content = await file.read()
   ```

4. **Dependency Injection**
   ```python
   from fastapi import Depends
   
   def get_db():
       # Return DB session
       ...
   
   @app.post("/endpoint")
   def endpoint(db: Session = Depends(get_db)):
       ...
   ```

5. **Configuration**
   - Use `app/core/config.py` for settings
   - Never hardcode credentials
   - Use environment variables

6. **Logging**
   ```python
   import logging
   logger = logging.getLogger(__name__)
   
   logger.info("Processing evidence...")
   logger.error(f"Failed to process: {e}")
   ```

### Module-Specific Guidelines

**AI Module** (`app/ai/`):
- Cache loaded models to avoid reloading
- Handle model loading errors gracefully
- Document model versions and parameters

**Graph Module** (`app/graph/`):
- Write efficient Cypher queries
- Use parameterized queries to prevent injection
- Index frequently queried properties

**RAG Module** (`app/rag/`):
- Limit context size to avoid token limits
- Implement proper chunking strategies
- Track retrieval metrics for optimization

---

## 🧪 Testing

### Manual Testing

Use the **FastAPI Swagger UI** at http://localhost:8000/docs

**Example workflow**:
1. Register user: `POST /auth/register`
2. Login: `POST /auth/login` (copy JWT token)
3. Create case: `POST /cases/`
4. Upload evidence: `POST /evidence/upload`
5. Ask question: `POST /rag/ask`
6. View timeline: `GET /graph/timeline/{case_id}`

### Automated Testing (Planned)

We're planning to add comprehensive test suites:

```bash
# Install testing dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest tests/
```

**Contribution opportunity**: Help us build test coverage!

---

## 🐛 Troubleshooting

### Common Issues

#### 1. **Neo4j Connection Failed**

**Error**: `Failed to connect to Neo4j`

**Solutions**:
- Verify Neo4j is running: Check Neo4j Desktop or `docker ps`
- Check credentials in `.env` file
- Ensure `NEO4J_URI` uses `bolt://` protocol
- Test connection: `http://localhost:7474/browser/`

#### 2. **OpenAI API Error**

**Error**: `OpenAI API key invalid`

**Solutions**:
- Verify API key in `.env`
- Check API key has credits: https://platform.openai.com/account/usage
- Ensure no extra spaces in key

#### 3. **spaCy Model Not Found**

**Error**: `Can't find model 'en_core_web_sm'`

**Solution**:
```bash
python -m spacy download en_core_web_sm
```

#### 4. **Import Errors**

**Error**: `ModuleNotFoundError: No module named 'app'`

**Solutions**:
- Ensure virtual environment is activated
- Run from project root directory
- Reinstall dependencies: `pip install -r requirements.txt`

#### 5. **CORS Errors (Frontend Integration)**

If frontend can't connect:
- Check `CORSMiddleware` in `app/main.py`
- Update `allow_origins` with frontend URL
- For development, `["*"]` allows all origins

#### 6. **File Upload Fails**

**Error**: `Unsupported file type`

**Solutions**:
- Check file extension (must be .pdf, .txt, .json, .csv)
- Verify file isn't corrupted
- Check file size limits in FastAPI config

### Debug Mode

Enable detailed logging:

```python
# In app/main.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Getting Help

- **GitHub Issues**: [Report bugs or request features](https://github.com/yourusername/nexustrace/issues)
- **Discussions**: [Ask questions](https://github.com/yourusername/nexustrace/discussions)
- **Email**: support@nexustrace.io (if available)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **FastAPI**: For the amazing web framework
- **Neo4j**: For the powerful graph database
- **OpenAI**: For GPT models
- **spaCy**: For NLP capabilities
- **Sentence-Transformers**: For efficient embeddings
- **All Contributors**: Thank you for your contributions!

---

## 📞 Contact

- **GitHub**: [@yourusername](https://github.com/yourusername)
- **Project**: [NexusTrace](https://github.com/yourusername/nexustrace)
- **Website**: https://nexustrace.io (if available)

---

**Happy Investigating! 🔍**
