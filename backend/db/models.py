from pydantic import BaseModel
from typing import Optional, List

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    image_base64: Optional[str] = None
    session_id: str

class ChatSession(BaseModel):
    id: str
    title: str
    updated_at: str

class TTSRequest(BaseModel):
    text: str
    voice: Optional[str] = "en-US-GuyNeural"
    
class ImageGenRequest(BaseModel):
    prompt: str
