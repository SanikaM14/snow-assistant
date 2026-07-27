import React, { useState, useRef } from 'react'
import { useMascotStore } from '../../store/mascotStore'

export default function VoiceRecorder({ onTranscription, disabled }) {
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  
  const { setMascotState, showSpeechBubble } = useMascotStore()

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
        stream.getTracks().forEach(t => t.stop())
        await processAudio(audioBlob)
      }
      
      mediaRecorder.start()
      setIsRecording(true)
      setMascotState('listening', 'happy')
      
    } catch (err) {
      console.error("Mic error:", err)
      showSpeechBubble("I can't access your microphone!", 3000)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setMascotState('thinking')
    }
  }
  
  const processAudio = async (blob) => {
    const formData = new FormData()
    formData.append('audio', blob, 'voice.webm')
    
      try {
        const res = await fetch('/api/stt', {
          method: 'POST',
          body: formData
        })
        if (!res.ok) throw new Error('Network error');
        const text = await res.text()
        const data = text ? JSON.parse(text) : {}
      
      if (data.text) {
        onTranscription(data.text)
        setMascotState('idle')
      } else if (data.text === "") {
        setMascotState('idle')
        showSpeechBubble("I didn't hear anything.", 3000)
      } else {
        throw new Error(data.error || "No text")
      }
    } catch (e) {
      console.error(e)
      setMascotState('error', 'sad')
      showSpeechBubble("I couldn't hear that properly.", 3000)
    }
  }

  return (
    <button
      onClick={isRecording ? stopRecording : startRecording}
      disabled={disabled}
      className={`h-11 w-11 rounded-full transition-all flex-shrink-0 flex items-center justify-center ${
        isRecording 
          ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
          : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={isRecording ? "Stop Recording" : "Start Voice Input"}
    >
      {isRecording ? <i className="bi bi-stop-fill text-xl"></i> : <i className="bi bi-mic-fill text-xl"></i>}
    </button>
  )
}
