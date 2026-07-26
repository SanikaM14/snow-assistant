# Snow Assistant

**Snow Assistant** is a multimodal AI desktop assistant featuring a live 3D mascot companion. It combines a powerful conversational backend with an interactive desktop overlay to provide a uniquely engaging user experience.

*The original concept and idea for Snow Assistant belongs to **Parth**, and the project was collaboratively developed by **Parth and Sanika**.*

---

## Features
- **Multimodal AI Interaction**: Chat with the assistant via text or voice.
- **Live 3D Mascot**: An interactive, animated 3D companion built directly into the desktop application.
- **Lightning Fast Inference**: Powered by **Groq** for ultra-fast, real-time AI responses.
- **Desktop Integration**: Built with Electron to run seamlessly as a native application on your operating system.

## Tech Stack
**Frontend:**
- React.js (built with Vite)
- Tailwind CSS (for styling)
- Three.js / React Three Fiber (for 3D Mascot rendering)

**Backend:**
- Python & FastAPI
- Groq API (LLM Integration)
- SQLite (Local Database)
- Text-to-Speech (TTS) and Speech-to-Text (STT) services

**Desktop Application:**
- Electron.js

## Folder Structure
```text
snow-assistant/
├── backend/            # FastAPI Python server, routing, DB models, and Groq/TTS services
├── electron/           # Electron main process and preload scripts for desktop packaging
├── frontend/           # React frontend UI, Mascot components, state management
├── .gitignore          # Git ignore rules for node_modules and Python venv
├── package.json        # Root package file for running Electron and concurrent scripts
└── README.md           # Project documentation
```

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python (3.10+)
- A valid Groq API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SanikaM14/snow-assistant.git
   cd snow-assistant
   ```

2. **Setup the Backend**
   ```bash
   cd backend
   python -m venv venv
   # On Windows: venv\Scripts\activate
   # On Mac/Linux: source venv/bin/activate
   pip install -r requirements.txt
   ```
   *Create a `.env` file in the project root and add your Groq API key:*
   ```env
   GROQ_API_KEY=your_api_key_here
   ```

3. **Setup the Frontend & Electron**
   ```bash
   # From the root directory:
   npm install
   
   # Install frontend dependencies:
   cd frontend
   npm install
   ```

### Running the Application
To run the full stack (Frontend, Backend, and Electron wrapper), simply run the start script from the root directory:
```bash
npm start
```

---
*Created by Parth and Sanika.*
