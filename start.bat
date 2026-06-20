@echo off
echo Starting Python FastAPI Backend...
start cmd /k "cd backend && if not exist venv (python -m venv venv) && .\venv\Scripts\Activate.ps1 && pip install -r requirements.txt && uvicorn app.main:app --port 8000"

echo Starting Next.js UI Frontend...
start cmd /k "cd frontend && npm install && npm run dev"

echo GitSpan is initializing... Both servers will open in new terminal windows!
