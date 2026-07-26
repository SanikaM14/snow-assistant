import os
import asyncio
from faster_whisper import WhisperModel

# Load model globally to avoid reloading on every request
# Use base or tiny for local speed
MODEL_SIZE = "base"
# On first run, this downloads the model to local cache
model = WhisperModel(MODEL_SIZE, device="cpu", compute_type="int8")

async def transcribe_audio(file_path: str) -> str:
    loop = asyncio.get_event_loop()
    
    def _transcribe():
        segments, info = model.transcribe(file_path, beam_size=5)
        text = "".join([segment.text for segment in segments])
        return text.strip()

    try:
        text = await loop.run_in_executor(None, _transcribe)
        return text
    except Exception as e:
        print(f"STT Error: {e}")
        return ""
