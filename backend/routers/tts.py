from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from db.models import TTSRequest
from services.tts_service import generate_tts_stream

router = APIRouter()

@router.post("/tts")
async def tts_endpoint(request: TTSRequest):
    if not request.text:
        raise HTTPException(status_code=400, detail="No text provided")
        
    return StreamingResponse(
        generate_tts_stream(request.text, request.voice), 
        media_type="audio/mpeg"
    )
