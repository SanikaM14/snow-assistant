import { create } from 'zustand'

export const useAppStore = create((set) => ({
  sessionId: localStorage.getItem('snow_session_id') || crypto.randomUUID(),
  theme: localStorage.getItem('snow_theme') || 'dark',
  isNetworkOnline: navigator.onLine,
  backendConnected: true,
  messages: [],
  
  setSessionId: (id) => {
    localStorage.setItem('snow_session_id', id)
    set({ sessionId: id, messages: [] })
  },
  
  setTheme: (theme) => {
    localStorage.setItem('snow_theme', theme)
    set({ theme })
  },
  
  setNetworkOnline: (status) => set({ isNetworkOnline: status }),
  setBackendConnected: (status) => set({ backendConnected: status }),
  
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  setMessages: (messages) => set({ messages }),
  
  updateLastMessage: (updater) => set((state) => {
    if (state.messages.length === 0) return state;
    const newMessages = [...state.messages];
    const lastIdx = newMessages.length - 1;
    newMessages[lastIdx] = updater(newMessages[lastIdx]);
    return { messages: newMessages };
  }),
}))
