import React, { useEffect, useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { useMascotStore } from '../../store/mascotStore'

export default function HistorySidebar({ isOpen, toggleSidebar }) {
  const [sessions, setSessions] = useState([])
  const { sessionId, setSessionId, setMessages, theme, setTheme } = useAppStore()
  const { setMascotState } = useMascotStore()

  const loadSessions = async () => {
    try {
      const res = await fetch('/api/sessions')
      if (!res.ok) { setSessions([]); return; }
      const text = await res.text()
      const data = text ? JSON.parse(text) : []
      setSessions(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadSessions()
  }, [sessionId]) // reload when session changes

  const loadHistory = async (id) => {
    try {
      const res = await fetch(`/api/sessions/${id}`)
      if (!res.ok) return;
      const text = await res.text()
      const data = text ? JSON.parse(text) : []
      setSessionId(id)
      setMessages(Array.isArray(data) ? data : [])
      setMascotState('greeting', 'happy')
      if (window.innerWidth < 768) toggleSidebar()
    } catch (e) {
      console.error(e)
    }
  }

  const handleNewChat = () => {
    setSessionId(crypto.randomUUID())
    setMascotState('greeting', 'happy')
    if (window.innerWidth < 768) toggleSidebar()
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    try {
      await fetch(`/api/sessions/${id}`, { method: 'DELETE' })
      if (id === sessionId) {
        setSessionId(crypto.randomUUID())
      }
      loadSessions()
    } catch(err) {
      console.error(err)
    }
  }

  return (
    <div className={`fixed inset-y-0 left-0 z-20 w-64 glass-panel flex flex-col transition-transform duration-300 md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      
      {/* Header */}
      <div className="p-5 border-b border-gray-200/50 dark:border-gray-800/50 flex justify-between items-center">
        <h1 className="font-bold text-2xl text-primary flex items-center gap-3 tracking-tight">
          <i className="bi bi-stars text-blue-500"></i> Snow
        </h1>
        <button className="md:hidden text-gray-500 hover:text-primary transition-colors" onClick={toggleSidebar}>
          <i className="bi bi-list text-2xl"></i>
        </button>
      </div>

      <div className="p-4">
        <button 
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-blue-700 text-primary-foreground rounded-xl py-3 px-4 transition-all hover-glow font-medium shadow-md"
        >
          <i className="bi bi-plus-lg"></i> New Chat
        </button>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto px-3 custom-scrollbar space-y-1">
        <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 px-2 mt-2">History</div>
        
        {sessions.map(s => (
          <div 
            key={s.id}
            onClick={() => loadHistory(s.id)}
            className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all group ${s.id === sessionId ? 'bg-blue-50/80 dark:bg-blue-900/30 text-primary shadow-sm' : 'hover:bg-gray-100/50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300'}`}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <i className={`bi bi-chat-left-text ${s.id === sessionId ? 'text-primary' : 'text-gray-400'}`}></i>
              <span className="truncate text-sm font-medium">{s.title || 'New Chat'}</span>
            </div>
            <button 
              onClick={(e) => handleDelete(e, s.id)}
              className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
              title="Delete chat"
            >
              <i className="bi bi-trash3-fill"></i>
            </button>
          </div>
        ))}
        {sessions.length === 0 && (
          <div className="text-center text-sm text-gray-500 py-6 flex flex-col items-center gap-2">
            <i className="bi bi-inbox text-2xl opacity-50"></i>
            No recent chats
          </div>
        )}
      </div>

      {/* Settings / Footer */}
      <div className="p-5 border-t border-gray-200/50 dark:border-gray-800/50 space-y-3 glass-panel">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            {theme === 'dark' ? <i className="bi bi-moon-stars-fill text-indigo-400"></i> : <i className="bi bi-sun-fill text-amber-500"></i>}
            Dark Mode
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={theme === 'dark'} onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')} />
            <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
          </label>
        </div>
      </div>
    </div>
  )
}
