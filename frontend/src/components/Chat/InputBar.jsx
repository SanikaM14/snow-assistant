import React, { useState, useRef } from 'react'
import VoiceRecorder from './VoiceRecorder'

export default function InputBar({ onSend, disabled }) {
  const [text, setText] = useState('')
  const [image, setImage] = useState(null)
  const fileInputRef = useRef(null)

  const handleSend = () => {
    if (!text.trim() && !image) return
    onSend(text, image)
    setText('')
    setImage(null)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = e.target.result.split(',')[1] // remove data:image/...;base64,
        setImage({ file, url: e.target.result, base64 })
      }
      reader.readAsDataURL(file)
    }
  }
  
  const handlePaste = (e) => {
    const items = e.clipboardData?.items
    if (!items) return
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile()
        const reader = new FileReader()
        reader.onload = (e) => {
           const base64 = e.target.result.split(',')[1]
           setImage({ file, url: e.target.result, base64 })
        }
        reader.readAsDataURL(file)
        break
      }
    }
  }

  const handleTranscription = (transcribedText) => {
    setText((prev) => prev ? prev + ' ' + transcribedText : transcribedText)
  }

  return (
    <div className="flex flex-col w-full glass-panel border-t-0 p-4">
      
      {image && (
        <div className="flex items-center gap-2 mb-3 bg-white/50 dark:bg-black/50 p-2 rounded-xl w-fit relative group backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
          <img src={image.url} alt="upload preview" className="h-16 w-16 object-cover rounded-lg" />
          <button 
            onClick={() => setImage(null)}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center shadow-lg hover:bg-red-600 transition-all hover:scale-110"
          >
            <i className="bi bi-x-lg text-xs"></i>
          </button>
        </div>
      )}

      <div className="flex items-end gap-3 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-1.5 pr-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary transition-all">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2.5 text-gray-500 hover:text-primary transition-colors flex-shrink-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 ml-1"
          title="Attach Image"
          disabled={disabled}
        >
          <i className="bi bi-image text-xl"></i>
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileChange}
        />
        
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Ask Snow anything... (Shift+Enter for new line)"
          className="flex-grow resize-none overflow-y-auto bg-transparent text-gray-900 dark:text-gray-100 py-3 px-2 outline-none max-h-32 min-h-[50px] custom-scrollbar"
          rows={1}
          disabled={disabled}
        />

        <VoiceRecorder onTranscription={handleTranscription} disabled={disabled} />

        <button
          onClick={handleSend}
          disabled={(!text.trim() && !image) || disabled}
          className={`h-11 w-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
            (!text.trim() && !image) || disabled
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-400'
              : 'bg-primary hover:bg-blue-700 text-white shadow-md hover-glow'
          }`}
          title="Send"
        >
          <i className="bi bi-send-fill text-lg ml-0.5"></i>
        </button>
      </div>
    </div>
  )
}
