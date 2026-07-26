import React, { useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerspectiveCamera, Html } from '@react-three/drei'
import MascotModel from './MascotModel'
import { useMascotStore } from '../../store/mascotStore'

function SpeechBubble() {
  const { speechBubbleText } = useMascotStore()
  
  if (!speechBubbleText) return null
  
  return (
    <Html position={[0, 2.5, 0]} center style={{ pointerEvents: 'none' }}>
      <div className="bg-card text-cardForeground border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-2 shadow-lg max-w-[200px] text-center text-sm animate-in fade-in zoom-in duration-300">
        {speechBubbleText}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-card border-t-solid"></div>
      </div>
    </Html>
  )
}

export default function MascotCanvas() {
  return (
    <div className="w-full h-full relative">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={40} />
        
        {/* Lights added locally to MascotModel, keeping minimal ambient here */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        <group position={[0, -0.8, 0]}>
          <MascotModel />
          <SpeechBubble />
        </group>
        
      </Canvas>
    </div>
  )
}
