import os
import httpx

async def transcribe_audio(file_path: str) -> str:
    """
    Transcribes audio using Groq's extremely fast Whisper API
    instead of a local model to stay within Vercel's serverless limits.
    """
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        print("STT Error: GROQ_API_KEY is not configured")
        return ""
        
    api_key = api_key.strip('"').strip("'")
    
    headers = {
        "Authorization": f"Bearer {api_key}"
    }
    
    try:
        # We use standard synchronous open with httpx async client 
        # which is perfectly fine for small audio files
        with open(file_path, "rb") as f:
            files = {
                "file": (os.path.basename(file_path), f, "audio/mpeg"),
                "model": (None, "whisper-large-v3-turbo")
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.groq.com/openai/v1/audio/transcriptions",
                    headers=headers,
                    files=files,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return data.get("text", "").strip()
                else:
                    print(f"Groq STT Error: {response.status_code} - {response.text}")
                    return ""
    except Exception as e:
        print(f"STT Exception: {e}")
        return ""
