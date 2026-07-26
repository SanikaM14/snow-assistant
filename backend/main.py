from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from routers import chat, stt, tts, image, sessions, health
from db.database import init_db

load_dotenv(dotenv_path="../.env", override=True)

app = FastAPI(title="Snow Backend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "app://."],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    await init_db()
    
    print("\n--- SNOW BACKEND STARTUP VALIDATION ---")
    
    # 1. Check LLM Provider
    provider = os.environ.get("LLM_PROVIDER", "groq").lower()
    print(f"[*] Active LLM Provider: {provider.upper()}")
    
    key = os.environ.get("GROQ_API_KEY")
    if key:
        masked = key[:6] + "..." + key[-4:] if len(key) > 10 else "***"
        print(f"[OK] GROQ_API_KEY is loaded: {masked}")
    else:
        print("[FAIL] GROQ_API_KEY is missing!")
    
    if provider == "groq":
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key or not api_key.strip():
            print("[ERROR] GROQ_API_KEY is missing or empty! Chat will fail.")
        else:
            print("[OK] GROQ_API_KEY is configured.")
    elif provider == "ollama":
        import httpx
        try:
            with httpx.Client() as client:
                res = client.get("http://localhost:11434/", timeout=2.0)
                if res.status_code == 200:
                    print("[OK] Ollama is running.")
                else:
                    print(f"[WARNING] Ollama returned status {res.status_code}")
        except Exception as e:
            print("[ERROR] Ollama is not reachable on localhost:11434! Chat will fail.")
    else:
        print(f"[ERROR] Unknown LLM_PROVIDER: {provider}")
        
    print("---------------------------------------\n")

app.include_router(health.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(stt.router, prefix="/api")
app.include_router(tts.router, prefix="/api")
app.include_router(image.router, prefix="/api")
app.include_router(sessions.router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
