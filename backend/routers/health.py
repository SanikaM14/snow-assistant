from fastapi import APIRouter
import os
import httpx

router = APIRouter()

@router.get("/health")
async def health_check():
    status = {
        "status": "ok",
        "groq_configured": False,
        "ollama": False
    }
    
    # Check Groq configuration
    api_key = os.environ.get("GROQ_API_KEY")
    if api_key and api_key.strip():
        status["groq_configured"] = True
        
    # Check Ollama connectivity
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("http://localhost:11434/", timeout=2.0)
            if response.status_code == 200:
                status["ollama"] = True
    except Exception:
        pass
        
    return status
