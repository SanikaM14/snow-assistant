import React, { useState, useRef } from 'react'
import { Send, Image as ImageIcon, X } from 'lucide-react'
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
    <div className="flex flex-col w-full bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4">
      
      {image && (
        <div className="flex items-center gap-2 mb-2 bg-gray-100 dark:bg-gray-800 p-2 rounded-lg w-fit relative group">
          <img src={image.url} alt="upload preview" className="h-16 w-16 object-cover rounded" />
          <button 
            onClick={() => setImage(null)}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2 w-full">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-3 text-gray-500 hover:text-blue-500 transition-colors flex-shrink-0"
          title="Attach Image"
          disabled={disabled}
        >
          <ImageIcon size={22} />
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
          placeholder="Ask Snow anything... (Shift+Enter for new line, paste images)"
          className="flex-grow resize-none overflow-y-auto bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl py-3 px-4 outline-none focus:ring-2 focus:ring-blue-500 max-h-32 min-h-[50px]"
          rows={1}
          disabled={disabled}
        />

        <VoiceRecorder onTranscription={handleTranscription} disabled={disabled} />

        <button
          onClick={handleSend}
          disabled={(!text.trim() && !image) || disabled}
          className={`p-3 rounded-full flex-shrink-0 transition-colors ${
            (!text.trim() && !image) || disabled
              ? 'bg-gray-200 dark:bg-gray-800 text-gray-400'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
          }`}
          title="Send"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  )
}
