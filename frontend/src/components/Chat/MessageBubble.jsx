import React, { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { useMascotStore } from '../../store/mascotStore'

export default function MessageBubble({ message }) {
  const { role, content, imageUrl, intent } = message
  const isUser = role === 'user'
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [copied, setCopied] = useState(false)
  const [currentImgUrl, setCurrentImgUrl] = useState(imageUrl)
  const audioRef = useRef(null)
  
  const { setMascotState, setMouthAmplitude } = useMascotStore()

  // Update currentImgUrl if message.imageUrl changes
  useEffect(() => {
    setCurrentImgUrl(imageUrl)
  }, [imageUrl])

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [])

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePlayTTS = async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
      setMascotState('idle')
      setMouthAmplitude(0)
      return
    }

    try {
      setIsPlaying(true)
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content })
      })
      
      if (!res.ok) throw new Error('TTS failed')
      
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      
      const audio = new Audio(url)
      audioRef.current = audio
      
      // Setup Web Audio API for lip sync
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const source = audioContext.createMediaElementSource(audio)
      const analyser = audioContext.createAnalyser()
      
      source.connect(analyser)
      analyser.connect(audioContext.destination)
      
      analyser.fftSize = 256
      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      
      let animationId
      
      const updateLipSync = () => {
        if (!isPlaying) return
        analyser.getByteFrequencyData(dataArray)
        
        let sum = 0
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i]
        }
        const average = sum / bufferLength
        // Map average (0-255) to amplitude (0-1)
        const amplitude = Math.min(1, average / 100)
        
        setMouthAmplitude(amplitude)
        animationId = requestAnimationFrame(updateLipSync)
      }
      
      audio.onplay = () => {
        setMascotState('speaking', 'happy')
        updateLipSync()
      }
      
      audio.onended = () => {
        setIsPlaying(false)
        setMascotState('idle')
        setMouthAmplitude(0)
        cancelAnimationFrame(animationId)
      }
      
      audio.play()
      
    } catch (e) {
      console.error(e)
      setIsPlaying(false)
    }
  }

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] md:max-w-[75%] rounded-3xl p-5 shadow-sm ${
        isUser 
        ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-sm shadow-[0_4px_14px_0_rgba(37,99,235,0.25)]' 
        : 'glass-panel text-gray-900 dark:text-gray-100 rounded-tl-sm'
      }`}>
        
        <div className="flex items-center gap-2 mb-3 opacity-80 text-[11px] font-bold uppercase tracking-widest">
          <div className="flex items-center gap-1.5">
            {isUser ? 'You' : 'Snow'}
            {!isUser && intent && (
              <span className="flex items-center gap-1 bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-full ml-1 backdrop-blur-sm" title={intent}>
                {intent === 'chat' && <i className="bi bi-chat-text"></i>}
                {intent === 'generate_image' && <i className="bi bi-image"></i>}
                {intent === 'analyze_image' && <i className="bi bi-eye"></i>}
                {intent === 'chat' ? 'chat' : intent === 'generate_image' ? 'generated' : 'analyzed'}
              </span>
            )}
          </div>
          {!isUser && (
            <div className="ml-auto flex gap-1">
              <button onClick={handlePlayTTS} className="h-7 w-7 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-all" title="Play TTS">
                {isPlaying ? <i className="bi bi-stop-fill text-sm"></i> : <i className="bi bi-play-fill text-sm"></i>}
              </button>
              <button onClick={handleCopy} className="h-7 w-7 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-all" title="Copy">
                {copied ? <i className="bi bi-check-lg text-sm text-green-500"></i> : <i className="bi bi-copy text-sm"></i>}
              </button>
            </div>
          )}
        </div>
        
        <div className={`prose prose-sm dark:prose-invert max-w-none break-words ${isUser ? 'text-white' : ''}`}>
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
        
        {currentImgUrl && (
          <div className="mt-4 relative group">
            <img src={`/api/image-proxy?url=${encodeURIComponent(currentImgUrl)}`} alt="Generated" className="rounded-xl shadow-md max-w-full max-h-[300px] object-cover ring-1 ring-black/5" />
            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {intent === 'generate_image' && (
                  <button 
                    onClick={() => {
                       const newUrl = currentImgUrl.replace(/seed=\d+/, `seed=${Math.floor(Math.random() * 100000)}`)
                       setCurrentImgUrl(newUrl)
                    }}
                    className="h-8 w-8 flex items-center justify-center bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white rounded-full transition-all hover:scale-110"
                    title="Regenerate"
                  >
                    <i className="bi bi-arrow-repeat"></i>
                  </button>
                )}
                <a href={`/api/image-proxy?url=${encodeURIComponent(currentImgUrl)}`} download="aria-image.jpg" className="h-8 w-8 flex items-center justify-center bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white rounded-full transition-all hover:scale-110">
                  <i className="bi bi-download"></i>
                </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
