import urllib.parse
import random

def get_pollinations_url(prompt: str) -> str:
    encoded_prompt = urllib.parse.quote(prompt)
    seed = random.randint(1, 100000)
    return f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1024&height=1024&nologo=true&seed={seed}"
