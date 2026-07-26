import { create } from 'zustand'

export const useMascotStore = create((set) => ({
  // State machine: idle, listening, thinking, speaking, greeting, celebrating, error
  animationState: 'greeting', 
  
  // Expressions: idle, happy, excited, thinking, confused, sad, alert
  expression: 'happy',
  
  // Lip sync amplitude (driven by audio playing)
  mouthAmplitude: 0,
  
  // Speech bubble text
  speechBubbleText: null,

  setMascotState: (animationState, expression = null) => {
    set((state) => ({ 
      animationState, 
      expression: expression || state.expression 
    }))
  },
  
  setExpression: (expression) => set({ expression }),
  
  setMouthAmplitude: (mouthAmplitude) => set({ mouthAmplitude }),
  
  showSpeechBubble: (text, duration = 3000) => {
    set({ speechBubbleText: text })
    if (duration > 0) {
      setTimeout(() => set({ speechBubbleText: null }), duration)
    }
  },
  
  hideSpeechBubble: () => set({ speechBubbleText: null })
}))
