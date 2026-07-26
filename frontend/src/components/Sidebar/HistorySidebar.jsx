import React, { useEffect, useState } from 'react'
import { MessageSquare, Trash2, Settings, Plus, Menu } from 'lucide-react'
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
    <div className={`fixed inset-y-0 left-0 z-20 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-transform duration-300 md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
        <h1 className="font-bold text-xl text-blue-600 dark:text-blue-400 flex items-center gap-2">
          <span className="text-2xl">✨</span> Snow
        </h1>
        <button className="md:hidden text-gray-500" onClick={toggleSidebar}>
          <Menu size={20} />
        </button>
      </div>

      <div className="p-4">
        <button 
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2 px-4 transition-colors font-medium shadow-sm"
        >
          <Plus size={18} /> New Chat
        </button>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto px-3 custom-scrollbar space-y-1">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">History</div>
        
        {sessions.map(s => (
          <div 
            key={s.id}
            onClick={() => loadHistory(s.id)}
            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors group ${s.id === sessionId ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <MessageSquare size={16} className="flex-shrink-0" />
              <span className="truncate text-sm font-medium">{s.title || 'New Chat'}</span>
            </div>
            <button 
              onClick={(e) => handleDelete(e, s.id)}
              className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {sessions.length === 0 && (
          <div className="text-center text-sm text-gray-500 py-4">No recent chats</div>
        )}
      </div>

      {/* Settings / Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            🌙 Dark Mode
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={theme === 'dark'} onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')} />
            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>
  )
}
