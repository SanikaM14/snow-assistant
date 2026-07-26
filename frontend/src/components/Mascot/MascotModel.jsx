import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useMascotStore } from '../../store/mascotStore'
import { damp } from './animations'

export default function MascotModel(props) {
  const group = useRef()
  const headRef = useRef()
  const bodyRef = useRef()
  const leftArmRef = useRef()
  const rightArmRef = useRef()
  const mouthRef = useRef()
  const leftEyeRef = useRef()
  const rightEyeRef = useRef()
  
  const { animationState, expression, mouthAmplitude } = useMascotStore()
  
  // Log the state to verify wiring (as requested by user)
  useEffect(() => {
    console.log('Mascot State Changed - Animation:', animationState, 'Expression:', expression)
  }, [animationState, expression])
  
  // Blinking logic state
  const blinkState = useRef({
    lastTime: 0,
    interval: 3 + Math.random() * 3, // 3-6 seconds
    isBlinking: false,
    blinkStartTime: 0
  })

  // Materials (Soft "Friendly Blob" Palette)
  const materials = useMemo(() => ({
    body: new THREE.MeshStandardMaterial({ color: '#B8C6FF', roughness: 0.5 }), // Soft periwinkle
    bodyLower: new THREE.MeshStandardMaterial({ color: '#8AA9FF', roughness: 0.5 }), // Gradient feel
    accent: new THREE.MeshStandardMaterial({ color: '#FFD166', roughness: 0.4 }), // Soft yellow accent
    hand: new THREE.MeshStandardMaterial({ color: '#FF8A65', roughness: 0.4 }), // Coral hand tips
    eye: new THREE.MeshStandardMaterial({ color: '#1A1A2E', roughness: 0.2 }), // Near-black
    glint: new THREE.MeshBasicMaterial({ color: '#FFFFFF' }), // Pure white glint
    mouth: new THREE.MeshStandardMaterial({ color: '#1A1A2E', roughness: 0.4 }),
    blush: new THREE.MeshStandardMaterial({ color: '#FFB6C1', transparent: true, opacity: 0.3, roughness: 1.0 }),
  }), [])

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime

    // 1. Base Idle Motion
    let bobY = Math.sin(t * 1.5) * 0.05
    let scalePulse = 1 + Math.sin(t * 1.5) * 0.02
    
    // 2. Blinking Logic
    let currentEyeScaleY = 1.0
    const bState = blinkState.current
    if (!bState.isBlinking && t - bState.lastTime > bState.interval) {
      bState.isBlinking = true
      bState.blinkStartTime = t
    }
    if (bState.isBlinking) {
      const blinkElapsed = t - bState.blinkStartTime
      if (blinkElapsed < 0.12) {
        currentEyeScaleY = 0.1 // Closed
      } else {
        bState.isBlinking = false
        bState.lastTime = t
        bState.interval = 3 + Math.random() * 3 // Next blink in 3-6s
      }
    }
    
    // 3. Target Rotations
    let headRotTarget = new THREE.Vector3(0, 0, 0)
    let bodyRotTarget = new THREE.Vector3(0, 0, 0)
    let lArmRotTarget = new THREE.Vector3(0, 0, 0.4) // Resting angle
    let rArmRotTarget = new THREE.Vector3(0, 0, -0.4)

    // 4. Expression Targets
    let mouthScaleTarget = new THREE.Vector3(1, 0.2, 0.5) // Default small flat line
    let eyeScaleTarget = new THREE.Vector3(1, currentEyeScaleY, 1)

    switch (expression) {
      case 'happy':
      case 'excited':
        mouthScaleTarget.set(1.5, 0.8, 0.5) // Big smile / open
        eyeScaleTarget.set(1, currentEyeScaleY * 1.2, 1) // Wide eyes
        break
      case 'sad':
      case 'alert':
      case 'error':
        mouthScaleTarget.set(0.8, -0.2, 0.5) // Frown (negative scale inverses capsule visually)
        eyeScaleTarget.set(1, currentEyeScaleY * 0.8, 1) // Squint
        break
      case 'thinking':
      case 'confused':
        mouthScaleTarget.set(0.6, 0.6, 0.5) // Small "o"
        break
      default: // idle, neutral
        mouthScaleTarget.set(1.2, 0.2, 0.5) // Small line
        break
    }

    // 5. Animation States
    switch (animationState) {
      case 'listening':
        headRotTarget.set(0.1, 0, 0.1) // Tilt
        bobY = Math.sin(t * 3) * 0.02 // Faster, smaller bob
        break
      case 'thinking':
        headRotTarget.set(-0.2, 0.3, 0) // Look up
        rArmRotTarget.set(2, 0, -0.5) // Hand to chin
        break
      case 'greeting':
        rArmRotTarget.set(2.8, 0, Math.sin(t * 15) * 0.4 - 0.8) // Natural side-to-side wave
        headRotTarget.set(0, 0, 0.1)
        break
      case 'celebrating':
        bobY = Math.abs(Math.sin(t * 8)) * 0.3 // Hop
        bodyRotTarget.set(0, Math.sin(t * 6) * 0.3, 0) // Sway
        lArmRotTarget.set(3, 0, 0.5)
        rArmRotTarget.set(3, 0, -0.5)
        mouthScaleTarget.set(1.5, 1.2, 0.5) // Huge open mouth
        break
      case 'error':
        headRotTarget.set(0, Math.sin(t * 20) * 0.2, 0) // Shake
        break
      case 'speaking':
        // Lip sync overrides mouth Y scale
        mouthScaleTarget.y = 0.2 + (mouthAmplitude * 2.5) 
        // Sync body pulse slightly to speech
        scalePulse += mouthAmplitude * 0.05
        break
    }

    // 6. Apply Damping
    if (group.current && bodyRef.current && headRef.current && leftArmRef.current && rightArmRef.current && mouthRef.current && leftEyeRef.current && rightEyeRef.current) {
      // Body Bob & Scale
      group.current.position.y = damp(group.current.position.y, bobY, 6, delta)
      bodyRef.current.scale.setScalar(damp(bodyRef.current.scale.x, scalePulse, 4, delta))
      
      // Rotations
      headRef.current.rotation.x = damp(headRef.current.rotation.x, headRotTarget.x, 6, delta)
      headRef.current.rotation.y = damp(headRef.current.rotation.y, headRotTarget.y, 6, delta)
      headRef.current.rotation.z = damp(headRef.current.rotation.z, headRotTarget.z, 6, delta)
      
      bodyRef.current.rotation.y = damp(bodyRef.current.rotation.y, bodyRotTarget.y, 6, delta)
      
      leftArmRef.current.rotation.x = damp(leftArmRef.current.rotation.x, lArmRotTarget.x, 6, delta)
      leftArmRef.current.rotation.z = damp(leftArmRef.current.rotation.z, lArmRotTarget.z, 6, delta)
      
      rightArmRef.current.rotation.x = damp(rightArmRef.current.rotation.x, rArmRotTarget.x, 6, delta)
      rightArmRef.current.rotation.z = damp(rightArmRef.current.rotation.z, rArmRotTarget.z, 6, delta)
      
      // Morphs
      mouthRef.current.scale.lerp(mouthScaleTarget, 0.3)
      // For eyes, we want instant snap for blinking but lerp for expression squinting.
      // We apply lerp, but if blinking, it snaps quickly.
      leftEyeRef.current.scale.lerp(eyeScaleTarget, bState.isBlinking ? 0.8 : 0.2)
      rightEyeRef.current.scale.lerp(eyeScaleTarget, bState.isBlinking ? 0.8 : 0.2)
    }
  })

  return (
    <group ref={group} {...props} dispose={null}>
      {/* Lights for soft shading */}
      <ambientLight intensity={0.6} color="#ffffff" />
      <pointLight position={[3, 4, 5]} intensity={1.5} color="#ffffff" castShadow distance={20} />
      <pointLight position={[-3, 2, -3]} intensity={0.5} color="#B8C6FF" distance={15} />

      {/* BODY - Capsule tapering into a rounded base */}
      <mesh ref={bodyRef} position={[0, -0.6, 0]} material={materials.bodyLower}>
        {/* Radius, length, capSegments, radialSegments */}
        <capsuleGeometry args={[0.5, 0.7, 32, 32]} />
        
        {/* Chest marking / Accent */}
        <mesh position={[0, 0.2, 0.45]} material={materials.accent}>
          <sphereGeometry args={[0.15, 32, 32]} />
        </mesh>
      </mesh>

      {/* HEAD - Squashed Sphere, 60/40 ratio */}
      <group ref={headRef} position={[0, 0.6, 0]}>
        {/* Base Head Geometry */}
        <mesh scale={[1, 0.85, 1]} material={materials.body}>
          <sphereGeometry args={[0.85, 64, 64]} />
        </mesh>
        
        {/* FACE FEATURES */}
        <group position={[0, -0.05, 0.78]}>
          
          {/* Left Eye */}
          <group position={[-0.35, 0.15, 0]}>
            <mesh ref={leftEyeRef} material={materials.eye} rotation={[0, -0.2, 0]}>
              <sphereGeometry args={[0.12, 32, 32]} />
              {/* Glint */}
              <mesh position={[0.04, 0.05, 0.1]} material={materials.glint}>
                <sphereGeometry args={[0.035, 16, 16]} />
              </mesh>
            </mesh>
          </group>

          {/* Right Eye */}
          <group position={[0.35, 0.15, 0]}>
            <mesh ref={rightEyeRef} material={materials.eye} rotation={[0, 0.2, 0]}>
              <sphereGeometry args={[0.12, 32, 32]} />
              {/* Glint */}
              <mesh position={[0.04, 0.05, 0.1]} material={materials.glint}>
                <sphereGeometry args={[0.035, 16, 16]} />
              </mesh>
            </mesh>
          </group>

          {/* Blush Cheeks */}
          <mesh position={[-0.45, -0.1, 0.05]} material={materials.blush} rotation={[-0.1, -0.3, 0]}>
            <sphereGeometry args={[0.1, 16, 16]} />
          </mesh>
          <mesh position={[0.45, -0.1, 0.05]} material={materials.blush} rotation={[-0.1, 0.3, 0]}>
            <sphereGeometry args={[0.1, 16, 16]} />
          </mesh>

          {/* Mouth (Capsule scaled to morph) */}
          <mesh ref={mouthRef} position={[0, -0.15, 0.08]} material={materials.mouth} rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.05, 0.08, 16, 16]} />
          </mesh>
          
        </group>
      </group>

      {/* LEFT ARM */}
      <group position={[-0.7, -0.2, 0]}>
        <group ref={leftArmRef}>
          {/* Shoulder pivot to arm */}
          <mesh position={[0, -0.3, 0]} rotation={[0, 0, 0.2]} material={materials.bodyLower}>
            <capsuleGeometry args={[0.12, 0.5, 16, 16]} />
            {/* Hand */}
            <mesh position={[0, -0.3, 0]} material={materials.hand}>
              <sphereGeometry args={[0.14, 32, 32]} />
            </mesh>
          </mesh>
        </group>
      </group>

      {/* RIGHT ARM */}
      <group position={[0.7, -0.2, 0]}>
        <group ref={rightArmRef}>
          {/* Shoulder pivot to arm */}
          <mesh position={[0, -0.3, 0]} rotation={[0, 0, -0.2]} material={materials.bodyLower}>
            <capsuleGeometry args={[0.12, 0.5, 16, 16]} />
            {/* Hand */}
            <mesh position={[0, -0.3, 0]} material={materials.hand}>
              <sphereGeometry args={[0.14, 32, 32]} />
            </mesh>
          </mesh>
        </group>
      </group>

    </group>
  )
}
