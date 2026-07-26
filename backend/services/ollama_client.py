import json
import httpx

async def stream_ollama_response(messages):
    system_prompt = {
        "role": "system",
        "content": (
            "You are Snow, a friendly, intelligent AI assistant. "
            "You must return your response as a valid JSON object with exactly two keys: "
            "'reply' (your markdown formatted text response) and 'emotion' (one of: happy, excited, neutral, thinking, error, sad). "
            "Do not include any other text outside the JSON object. "
            "Example: {\"reply\": \"Hello! How can I help you?\", \"emotion\": \"happy\"}"
        )
    }
    
    formatted_messages = [system_prompt] + messages
    
    try:
        async with httpx.AsyncClient() as client:
            async with client.stream(
                "POST", 
                "http://localhost:11434/api/chat",
                json={
                    "model": "llama3",
                    "messages": formatted_messages,
                    "format": "json"
                },
                timeout=None
            ) as response:
                if response.status_code != 200:
                    yield f"data: {json.dumps({'error': 'Ollama error: ' + str(response.status_code)})}\n\n"
                    return
                    
                async for chunk in response.aiter_bytes():
                    if chunk:
                        try:
                            # Ollama returns ndjson chunks like {"model":"llama3","message":{"role":"assistant","content":" Hello"},"done":false}
                            lines = chunk.decode('utf-8').strip().split('\n')
                            for line in lines:
                                if line:
                                    data = json.loads(line)
                                    if "message" in data and "content" in data["message"]:
                                        # Yield standard token format expected by frontend
                                        content = data["message"]["content"]
                                        yield f"data: {json.dumps({'token': content})}\n\n"
                        except Exception as e:
                            pass
        yield "data: [DONE]\n\n"
    except Exception as e:
        print(f"Ollama connection error: {e}")
        yield f"data: {json.dumps({'error': 'Failed to connect to Ollama: ' + str(e)})}\n\n"
