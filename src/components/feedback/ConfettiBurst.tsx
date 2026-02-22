'use client'

import { useEffect, useMemo, useState } from 'react'

export interface ConfettiBurstProps {
  trigger: boolean
  onComplete?: () => void
}

const CONFETTI_COLORS = [
  'var(--color-coral)',
  'var(--color-lavender)',
  'var(--color-teal)',
  'var(--color-golden)',
  'var(--color-coral-light)',
  'var(--color-lavender-light)',
  'var(--color-teal-light)',
  'var(--color-sky)',
]

const PARTICLE_COUNT = 36
const DURATION_MS = 2800

interface Particle {
  id: number
  color: string
  left: string
  delay: string
  spin: string
  drift: number
  size: number
  shape: 'square' | 'circle' | 'rect'
}

/**
 * CSS-only confetti burst overlay.
 * Renders 36 particles that fall from the top with random rotation and drift.
 * Auto-cleans up after the animation completes.
 */
export default function ConfettiBurst({ trigger, onComplete }: ConfettiBurstProps) {
  const [active, setActive] = useState(false)

  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const shape = (['square', 'circle', 'rect'] as const)[i % 3]
      return {
        id: i,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        left: `${2 + Math.random() * 96}%`,
        delay: `${Math.random() * 0.8}s`,
        spin: `${400 + Math.random() * 600}deg`,
        drift: (Math.random() - 0.5) * 80,
        size: 6 + Math.random() * 6,
        shape,
      }
    })
  }, [])

  useEffect(() => {
    if (!trigger) return

    setActive(true)
    const timer = setTimeout(() => {
      setActive(false)
      onComplete?.()
    }, DURATION_MS)

    return () => clearTimeout(timer)
  }, [trigger, onComplete])

  if (!active) return null

  return (
    <div
      className="fixed inset-0 z-50 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-confetti-fall"
          style={{
            left: p.left,
            top: '-2%',
            animationDelay: p.delay,
            '--confetti-spin': p.spin,
          } as React.CSSProperties}
        >
          <div
            style={{
              width: p.size,
              height: p.shape === 'rect' ? p.size * 1.8 : p.size,
              backgroundColor: p.color,
              borderRadius: p.shape === 'circle' ? '50%' : '2px',
              transform: `translateX(${p.drift}px)`,
            }}
          />
        </div>
      ))}
    </div>
  )
}

export { ConfettiBurst }
