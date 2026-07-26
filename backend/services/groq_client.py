import os
import json
import httpx

async def stream_groq_response(messages, image_base64=None):
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        yield json.dumps({"error": "GROQ_API_KEY not configured"})
        return
    api_key = api_key.strip('"').strip("'")

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
    
    formatted_messages = [system_prompt]
    
    # If image is provided, we must use the vision model and format the last user message
    if image_base64:
        model = "llama-3.2-11b-vision-preview" # Groq's current vision model
        for idx, m in enumerate(messages):
            if idx == len(messages) - 1 and m["role"] == "user":
                # Strip the "[Attached Image]" prefix we added for the text history
                text_content = m["content"].replace("[Attached Image]\n", "")
                formatted_messages.append({
                    "role": "user",
                    "content": [
                        {"type": "text", "text": text_content},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}}
                    ]
                })
            else:
                # The vision model on Groq currently doesn't support structured outputs (response_format)
                # So we just pass the text messages
                formatted_messages.append(m)
    else:
        model = os.environ.get("GROQ_MODEL", "llama-3.1-8b-instant")
        formatted_messages.extend(messages)
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": model,
        "messages": formatted_messages,
        "temperature": 0.7,
        "max_tokens": 2048,
        "stream": True
    }
    
    # Only text models support JSON object constraint currently on Groq
    if not image_base64:
        payload["response_format"] = {"type": "json_object"}

    try:
        async with httpx.AsyncClient() as client:
            async with client.stream(
                "POST", 
                "https://api.groq.com/openai/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=None
            ) as response:
                
                if response.status_code != 200:
                    error_text = await response.aread()
                    yield f"data: {json.dumps({'error': f'Groq API error {response.status_code}: {error_text.decode()}'})}\n\n"
                    return
                
                async for chunk in response.aiter_lines():
                    if chunk.startswith("data: "):
                        data_str = chunk[6:]
                        if data_str.strip() == "[DONE]":
                            break
                        try:
                            data = json.loads(data_str)
                            if data.get("choices") and len(data["choices"]) > 0:
                                delta = data["choices"][0].get("delta", {})
                                if "content" in delta and delta["content"]:
                                    yield f"data: {json.dumps({'token': delta['content']})}\n\n"
                        except json.JSONDecodeError:
                            pass
        yield "data: [DONE]\n\n"
    except Exception as e:
        print(f"Groq API Error: {e}")
        yield f"data: {json.dumps({'error': str(e)})}\n\n"
