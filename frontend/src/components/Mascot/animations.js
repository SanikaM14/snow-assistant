// Helper functions for Three.js animations
import * as THREE from 'three'

export const lerp = (start, end, t) => {
  return start * (1 - t) + end * t;
}

export const damp = (current, target, smoothing, dt) => {
  return THREE.MathUtils.damp(current, target, smoothing, dt)
}
