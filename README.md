# Aria Desktop AI Assistant

# Snow - Multimodal AI Assistant

Snow is a local desktop AI assistant with a persistent 3D animated mascot, voice input (STT), voice output (TTS), and image generation capabilities.

## Tech Stack
- **Frontend**: React 18, Vite, Three.js, React Three Fiber, TailwindCSS, Zustand
- **Desktop**: Electron
- **Backend**: FastAPI, Python 3.11+
- **AI Models**: Groq API (LLM), Faster-Whisper (STT), Edge-TTS, Pollinations AI (Images)

## Setup Instructions

   ```

### 4. Running the App
From the project root, run:
```powershell
npm start
```
This command concurrently starts the FastAPI backend, the Vite frontend development server, and the Electron shell.

## Local AI (Ollama) Setup (Optional)
If you wish to use local models instead of Groq:
1. Ensure Ollama is running.
2. Pull a text model: `ollama run llama3.1` or `ollama run qwen2.5`
3. Pull a vision model (for image analysis): `ollama run llama3.2-vision`
4. Toggle "Use Groq" off in the application interface or backend logic.
