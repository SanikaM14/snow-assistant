import { useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import { useMascotStore } from '../store/mascotStore'

export function useNetworkStatus() {
  const { setNetworkOnline, setBackendConnected } = useAppStore()
  const { setMascotState, showSpeechBubble } = useMascotStore()

  useEffect(() => {
    const handleOnline = () => {
      setNetworkOnline(true)
      setMascotState('idle', 'happy')
      showSpeechBubble("We're back online!")
    }
    
    const handleOffline = () => {
      setNetworkOnline(false)
      setMascotState('error', 'alert')
      showSpeechBubble("Uh-oh, looks like we're offline — check your network connection!", 5000)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Initial check
    if (!navigator.onLine) {
      handleOffline()
    }

    // Backend health check loop
    const interval = setInterval(async () => {
      if (!navigator.onLine) return; // Don't check backend if OS is offline
      
      try {
        const res = await fetch('/api/health')
        if (res.ok) {
          useAppStore.getState().setBackendConnected(true)
        } else {
          throw new Error('Backend not ok')
        }
      } catch (err) {
        if (useAppStore.getState().backendConnected) {
          useAppStore.getState().setBackendConnected(false)
          setMascotState('error', 'sad')
        }
      }
    }, 5000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])
}
