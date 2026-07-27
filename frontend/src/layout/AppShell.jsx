import React, { useState, useEffect } from 'react'
import HistorySidebar from '../components/Sidebar/HistorySidebar'
import ChatWindow from '../components/Chat/ChatWindow'
import MascotCanvas from '../components/Mascot/MascotCanvas'
import { useNetworkStatus } from '../hooks/useNetworkStatus'
import { useAppStore } from '../store/appStore'

export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { theme } = useAppStore()

  // Initialize network and health listeners
  useNetworkStatus()

  // Handle theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground font-sans transition-colors duration-300">
      <HistorySidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Mobile Header */}
        <div className="md:hidden p-3 glass-panel border-b-0 border-b border-gray-200/50 dark:border-gray-800/50 flex items-center justify-between z-10 sticky top-0">
          <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:text-primary transition-colors">
            <i className="bi bi-list text-2xl"></i>
          </button>
          <span className="font-bold tracking-tight text-lg flex items-center gap-2 text-primary"><i className="bi bi-stars"></i> Snow</span>
          <div className="w-8"></div> {/* spacer */}
        </div>

        <div className="flex-1 flex flex-row overflow-hidden relative">
          
          {/* Main Chat Area */}
          <div className="flex-1 h-full flex flex-col min-w-0">
            <ChatWindow />
          </div>

          {/* 3D Mascot Panel (Desktop: side, Mobile: float or bottom) */}
          <div className="hidden lg:block w-[360px] h-full glass-panel shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.1)] z-10 relative">
            <MascotCanvas />
          </div>
          
          {/* Mobile Mascot Overlay */}
          <div className="lg:hidden absolute top-16 right-4 w-32 h-48 pointer-events-none z-10 drop-shadow-2xl">
             <div className="w-full h-full pointer-events-auto">
               <MascotCanvas />
             </div>
          </div>
          
        </div>
      </div>
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-10 transition-opacity" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
