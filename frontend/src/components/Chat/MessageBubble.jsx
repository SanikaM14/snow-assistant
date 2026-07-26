import React, { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { Play, Square, Download, Copy, Check, RefreshCw, MessageSquare, Image, Eye } from 'lucide-react'
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
    <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${isUser ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-sm border border-gray-100 dark:border-gray-700'}`}>
        
        <div className="flex items-center gap-2 mb-2 opacity-80 text-xs font-semibold uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            {isUser ? 'You' : 'Snow'}
            {!isUser && intent && (
              <span className="flex items-center text-[10px] bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded-full ml-1" title={intent}>
                {intent === 'chat' && <MessageSquare size={10} className="mr-1" />}
                {intent === 'generate_image' && <Image size={10} className="mr-1" />}
                {intent === 'analyze_image' && <Eye size={10} className="mr-1" />}
                {intent === 'chat' ? 'chat' : intent === 'generate_image' ? 'generated' : 'analyzed'}
              </span>
            )}
          </div>
          {!isUser && (
            <div className="ml-auto flex gap-1">
              <button onClick={handlePlayTTS} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors" title="Play TTS">
                {isPlaying ? <Square size={14} /> : <Play size={14} />}
              </button>
              <button onClick={handleCopy} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors" title="Copy">
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          )}
        </div>
        
        <div className="prose prose-sm dark:prose-invert max-w-none break-words">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
        
        {currentImgUrl && (
          <div className="mt-3 relative group">
            <img src={`/api/image-proxy?url=${encodeURIComponent(currentImgUrl)}`} alt="Generated" className="rounded-lg shadow-md max-w-full max-h-64 object-cover" />
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {intent === 'generate_image' && (
                  <button 
                    onClick={() => {
                       const newUrl = currentImgUrl.replace(/seed=\d+/, `seed=${Math.floor(Math.random() * 100000)}`)
                       setCurrentImgUrl(newUrl)
                    }}
                    className="p-2 bg-black/50 hover:bg-black/80 text-white rounded transition-colors"
                    title="Regenerate"
                  >
                    <RefreshCw size={16} />
                  </button>
                )}
                <a href={`/api/image-proxy?url=${encodeURIComponent(currentImgUrl)}`} download="aria-image.jpg" className="p-2 bg-black/50 hover:bg-black/80 text-white rounded transition-colors">
                  <Download size={16} />
                </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
