import React, { useRef, useEffect, useState } from 'react'
import MessageBubble from './MessageBubble'
import InputBar from './InputBar'
import { useAppStore } from '../../store/appStore'
import { useMascotStore } from '../../store/mascotStore'

export default function ChatWindow() {
  const { messages, addMessage, updateLastMessage, sessionId, useGroq, backendConnected } = useAppStore()
  const { setMascotState } = useMascotStore()
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef(null)

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])



  const handleSend = async (text, imageObj) => {
    // Add user message immediately
    const userMsg = { 
      role: 'user', 
      content: text, 
      imageUrl: imageObj?.url 
    }
    addMessage(userMsg)
    setIsTyping(true)
    setMascotState('thinking', 'thinking')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          image_base64: imageObj?.base64,
          session_id: sessionId
        })
      })

      if (!response.ok) throw new Error('Network response was not ok')

      addMessage({ role: 'assistant', content: '' })
      
      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let done = false
      let fullText = ""

      while (!done) {
        const { value, done: readerDone } = await reader.read()
        done = readerDone
        if (value) {
          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6)
              if (dataStr === '[DONE]') {
                done = true
                break
              }
              try {
                const data = JSON.parse(dataStr)
                if (data.error) {
                   fullText += `\n**Error:** ${data.error}`
                   setMascotState('error', 'sad')
                } else if (data.type === 'image') {
                   // Render image immediately
                   updateLastMessage(msg => ({ 
                       ...msg, 
                       content: data.caption || "", 
                       imageUrl: data.image_url,
                       intent: "generate_image"
                   }))
                   setMascotState('celebrating', 'excited')
                   fullText = data.caption || ""
                } else if (data.token) {
                   fullText += data.token
                }
                
                if (data.type !== 'image') {
                   updateLastMessage(msg => ({ ...msg, content: fullText, intent: imageObj?.base64 ? "analyze_image" : "chat" }))
                }
              } catch (e) {
                // Ignore parse errors on partial chunks
              }
            }
          }
        }
      }

      // Final parse to see if model returned JSON with emotion (only for text intent)
      try {
         const start = fullText.indexOf('{')
         const end = fullText.lastIndexOf('}')
         if (start !== -1 && end !== -1) {
             const jsonStr = fullText.substring(start, end + 1)
             const parsed = JSON.parse(jsonStr)
             
             // Check if it's an image response again just in case
             if (parsed.type !== 'image') {
                 updateLastMessage(msg => ({ ...msg, content: parsed.reply || fullText }))
                 
                 const emotion = parsed.emotion || 'neutral'
                 if (emotion === 'happy' || emotion === 'excited') {
                   setMascotState('celebrating', 'excited')
                 } else {
                   setMascotState('idle', emotion)
                 }
             }
         } else {
             // For vision model which doesn't return JSON
             setMascotState('idle', 'happy')
         }
      } catch (e) {
         setMascotState('idle', 'happy')
      }

    } catch (error) {
      console.error(error)
      addMessage({ role: 'assistant', content: "**System Error:** Failed to connect to Snow backend." })
      setMascotState('error', 'sad')
    } finally {
      setIsTyping(false)
      // reset to idle if celebrating finishes (handled in mascot store or auto-revert normally, we'll let idle reset it after 3s)
      setTimeout(() => {
        if(useMascotStore.getState().animationState === 'celebrating') {
          setMascotState('idle', 'happy')
        }
      }, 4000)
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 relative">
      <div className="flex-grow overflow-y-auto p-4 md:p-6 custom-scrollbar">
        
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-600 space-y-4">
            <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <span className="text-4xl text-blue-500">✨</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Welcome to Snow</h2>
            <p className="text-center max-w-sm">I'm your multimodal AI assistant. Ask me anything, speak to me, or show me an image!</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <MessageBubble key={idx} message={msg} />
          ))
        )}
        
        {isTyping && (
          <div className="flex w-full mb-4 justify-start">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex gap-1 items-center h-12">
               <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
               <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
               <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="w-full">
        <InputBar onSend={handleSend} disabled={isTyping} />
      </div>
    </div>
  )
}
