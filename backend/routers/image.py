from fastapi import APIRouter
from db.models import ImageGenRequest
from services.image_service import get_pollinations_url
import requests

router = APIRouter()

@router.post("/generate-image")
async def generate_image_endpoint(request: ImageGenRequest):
    url = get_pollinations_url(request.prompt)
    return {"url": url}

from fastapi.responses import StreamingResponse
import httpx

@router.get("/image-proxy")
async def proxy_image(url: str):
    async def fetch_image():
        async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
            async with client.stream("GET", url) as response:
                async for chunk in response.aiter_bytes():
                    yield chunk
    return StreamingResponse(fetch_image(), media_type="image/jpeg")
