import re
import os
import httpx
from pydantic import BaseModel

class IntentResponse(BaseModel):
    intent: str

async def get_intent(message: str, has_image: bool) -> str:
    """
    Classify the user intent into one of: 'generate_image', 'analyze_image', 'chat'.
    Uses a fast rule-based approach first, falling back to an LLM if ambiguous.
    """
    if has_image:
        return "analyze_image"
        
    lower_msg = message.lower().strip()
    
    # 1. Rule-based classification
    generate_triggers = [
        r"^generate (an )?image (of )?",
        r"^create (an )?image (of )?",
        r"^create (a )?(an )?",
        r"^draw (me )?(a )?",
        r"^paint (me )?(a )?",
        r"^make (me )?(a )?(picture|photo) (of )?",
        r"^(a )?picture of "
    ]
    
    for trigger in generate_triggers:
        if re.search(trigger, lower_msg):
            return "generate_image"
            
    # 2. LLM Fallback for ambiguous cases
    # Only if it uses keywords but doesn't match the strict regex
    ambiguous_keywords = ["generate", "image", "draw", "picture", "photo", "paint", "create", "make"]
    if not any(k in lower_msg for k in ambiguous_keywords):
        return "chat"
        
    # Ask LLM
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        return "chat"
        
    api_key = api_key.strip('"').strip("'")
    
    system_prompt = (
        "Classify this user message into exactly one of: chat, generate_image, analyze_image. "
        "Respond with only the single word."
    )
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama-3.1-8b-instant",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": message}
                    ],
                    "max_tokens": 10,
                    "temperature": 0.0
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                reply = data["choices"][0]["message"]["content"].strip().lower()
                if reply in ["chat", "generate_image", "analyze_image"]:
                    return reply
    except Exception as e:
        print(f"Intent classification fallback error: {e}")
        
    return "chat"

def extract_image_prompt(message: str) -> str:
    """Extracts the core subject from an image generation request."""
    lower_msg = message.lower().strip()
    
    # Remove common prefixes
    prefixes = [
        "generate an image of", "generate image of", "generate",
        "create an image of", "create image of", "create a picture of", "create",
        "draw me a", "draw a", "draw",
        "paint me a", "paint a", "paint",
        "make me a photo of", "make a photo of", "make a picture of",
        "picture of", "photo of",
        "please", "can you", "i want"
    ]
    
    result = message
    result_lower = lower_msg
    
    for prefix in prefixes:
        if result_lower.startswith(prefix):
            # Cut off prefix
            result = result[len(prefix):].strip()
            result_lower = result.lower()
            
    # Clean up leading punctuation or words
    while result and (result[0] in ".,:;!?- " or result_lower.startswith("a ") or result_lower.startswith("an ")):
        if result_lower.startswith("a "):
            result = result[2:].strip()
        elif result_lower.startswith("an "):
            result = result[3:].strip()
        else:
            result = result[1:].strip()
        result_lower = result.lower()
        
    if not result:
        return message # Fallback if stripped everything
        
    return result
