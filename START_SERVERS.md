# NexusTrace Server Startup Guide

## Quick Start

### 1. Start Backend Server

Open a terminal in the `nexustrace-backend` directory and run:

```powershell
# Navigate to backend directory
cd nexustrace-backend

# Activate virtual environment and start server
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

**Expected output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
```

Verify backend is running by visiting: http://localhost:8000/docs

---

### 2. Start Frontend Server

Open a **new terminal** in the `nexustrace-frontend` directory and run:

```powershell
# Navigate to frontend directory
cd nexustrace-frontend

# Start Next.js development server
npm run dev
```

**Expected output:**
```
▲ Next.js 16.x.x
- Local:        http://localhost:3000
```

Visit the app at: http://localhost:3000

---

## Troubleshooting

### Backend Issues

**Problem:** `ModuleNotFoundError: No module named 'app'`
- **Solution:** Make sure you're in the `nexustrace-backend` directory before running uvicorn

**Problem:** `No module named 'uvicorn'`
- **Solution:** Install dependencies:
  ```powershell
  cd nexustrace-backend
  pip install -r requirements.txt
  ```

**Problem:** Virtual environment not found
- **Solution:** Create virtual environment:
  ```powershell
  cd nexustrace-backend
  python -m venv .venv
  .\.venv\Scripts\Activate.ps1
  pip install -r requirements.txt
  ```

### Frontend Issues

**Problem:** `Network Error` when clicking "Close Case"
- **Solution:** Ensure backend server is running on http://localhost:8000
- Check backend server terminal for any errors

**Problem:** Dependencies not installed
- **Solution:**
  ```powershell
  cd nexustrace-frontend
  npm install
  ```

---

## Production Startup

For production deployment, use:

### Backend
```powershell
cd nexustrace-backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend
```powershell
cd nexustrace-frontend
npm run build
npm start
```

---

## Environment Variables

### Backend (.env)
Located at: `nexustrace-backend/.env`

Required variables:
- `NEO4J_URI` - Neo4j database connection URI
- `NEO4J_USER` - Neo4j username
- `NEO4J_PASSWORD` - Neo4j password  
- `SECRET_KEY` - JWT secret key
- `OPENAI_API_KEY` - OpenAI API key (optional for AI features)

### Frontend
If needed, create `nexustrace-frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Health Checks

- Backend API Docs: http://localhost:8000/docs
- Frontend: http://localhost:3000
- Neo4j Browser: Check your Neo4j Aura console
