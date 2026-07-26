from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
import json
import uuid
import datetime
import os

from db.database import get_db
from db.models import ChatRequest
from services.groq_client import stream_groq_response
from services.ollama_client import stream_ollama_response
from services.intent_service import get_intent, extract_image_prompt
from services.image_service import get_pollinations_url

router = APIRouter()

@router.post("/chat")
async def chat_endpoint(request: ChatRequest, db=Depends(get_db)):
    # 1. Ensure session exists
    session_id = request.session_id
    cursor = await db.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
    session = await cursor.fetchone()
    
    if not session:
        # Create new session
        title = request.message[:30] + "..." if len(request.message) > 30 else request.message
        await db.execute("INSERT INTO sessions (id, title) VALUES (?, ?)", (session_id, title))
    else:
        await db.execute("UPDATE sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?", (session_id,))
        
    # 2. Save user message
    user_content = request.message
    if request.image_base64:
        user_content = f"[Attached Image]\n{request.message}"
        
    await db.execute("INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)", 
                     (session_id, "user", user_content))
    await db.commit()
    
    # Intent routing
    has_image = bool(request.image_base64)
    intent = await get_intent(request.message, has_image)

    # 3. Retrieve history
    cursor = await db.execute("SELECT role, content FROM messages WHERE session_id = ? ORDER BY id ASC", (session_id,))
    rows = await cursor.fetchall()
    
    messages = [{"role": row["role"], "content": row["content"]} for row in rows]
    
    # If using vision, the format differs depending on API. 
    # For simplicity, we just pass the text history and append the image to the last message if using Ollama vision.
    if request.image_base64:
         messages[-1] = {
             "role": "user",
             "content": f"{request.message}\nImage data: data:image/jpeg;base64,{request.image_base64}"
         }

    # 4. Stream response and save assistant message
    async def event_generator():
        if intent == "generate_image":
            # Image Generation path
            prompt_subject = extract_image_prompt(request.message)
            image_url = get_pollinations_url(prompt_subject)
            
            caption = f"Here is your image of {prompt_subject}!"
            
            # Yield structured image response
            yield f"data: {json.dumps({'type': 'image', 'image_url': image_url, 'caption': caption})}\n\n"
            yield "data: [DONE]\n\n"
            
            # Save to DB
            import aiosqlite
            from db.database import DB_PATH
            try:
                async with aiosqlite.connect(DB_PATH) as new_db:
                    await new_db.execute(
                        "INSERT INTO messages (session_id, role, content, image_url, intent) VALUES (?, ?, ?, ?, ?)", 
                        (session_id, "assistant", caption, image_url, intent)
                    )
                    await new_db.commit()
            except Exception as e:
                print(f"Error saving assistant image message: {e}")
            return

        # Text/Vision path
        full_response_text = ""
        emotion = "neutral"
        
        provider = os.environ.get("LLM_PROVIDER", "groq").lower()
        if provider == "ollama":
            generator = stream_ollama_response(messages)
        else:
            generator = stream_groq_response(messages, image_base64=request.image_base64 if intent == "analyze_image" else None)
        
        async for chunk in generator:
            yield chunk
            
            if chunk.startswith("data: ") and chunk.strip() != "data: [DONE]":
                try:
                    data = json.loads(chunk[6:])
                    if "token" in data:
                        full_response_text += data["token"]
                except:
                    pass
                    
        try:
             start = full_response_text.find('{')
             end = full_response_text.rfind('}')
             if start != -1 and end != -1:
                 json_str = full_response_text[start:end+1]
                 parsed = json.loads(json_str)
                 reply = parsed.get("reply", full_response_text)
             else:
                 reply = full_response_text
        except:
             reply = full_response_text

        import aiosqlite
        from db.database import DB_PATH
        try:
            async with aiosqlite.connect(DB_PATH) as new_db:
                await new_db.execute(
                    "INSERT INTO messages (session_id, role, content, intent) VALUES (?, ?, ?, ?)", 
                    (session_id, "assistant", reply, intent)
                )
                await new_db.commit()
        except Exception as e:
            print(f"Error saving assistant message: {e}")
        
    return StreamingResponse(event_generator(), media_type="text/event-stream")
