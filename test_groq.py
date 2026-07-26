import os
from dotenv import load_dotenv
import httpx
import asyncio

load_dotenv(".env", override=True)

async def test_groq():
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        print("No API key")
        return
        
    api_key = api_key.strip('"').strip("'")
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    data = {
        "model": "llama-3.1-8b-instant",
        "messages": [{"role": "user", "content": "hi"}],
        "max_tokens": 10
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=data
        )
        print("Status:", response.status_code)
        print("Response:", response.text)

if __name__ == "__main__":
    asyncio.run(test_groq())
