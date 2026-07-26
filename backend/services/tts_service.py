import edge_tts
import io

async def generate_tts_stream(text: str, voice: str = "en-US-GuyNeural"):
    communicate = edge_tts.Communicate(text, voice)
    # Yield raw mp3 chunks
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            yield chunk["data"]
