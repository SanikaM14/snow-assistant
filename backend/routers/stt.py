from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse
import shutil
import os
import uuid

from services.stt_service import transcribe_audio

router = APIRouter()

@router.post("/stt")
async def stt_endpoint(audio: UploadFile = File(...)):
    if not audio:
        return JSONResponse({"error": "No audio file provided"}, status_code=400)
        
    # Save temp file
    temp_filename = f"temp_{uuid.uuid4().hex}_{audio.filename}"
    with open(temp_filename, "wb") as buffer:
        shutil.copyfileobj(audio.file, buffer)
        
    try:
        text = await transcribe_audio(temp_filename)
        return {"text": text}
    finally:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)
