'use client'

import { useEffect, useState, useCallback } from 'react'
import { LottieMascot } from '@/components/mascot/LottieMascot'
import { SpeechBubble } from '@/components/mascot/SpeechBubble'
import { FUN_FACTS } from '@/lib/constants/fun-facts'

export interface LoadingPainterProps {
  /** The token labels the user selected (displayed as the "recipe") */
  tokens: string[]
  /** The style label (e.g. "Watercolor", "Pixel Art") */
  style?: string
  className?: string
}

const CYCLE_INTERVAL_MS = 5000

/**
 * Generation waiting screen.
 *
 * Shows Lottie in 'thinking' state, animated progress bar,
 * rotating fun facts, and the user's selected token recipe.
 */
export default function LoadingPainter({
  tokens,
  style,
  className = '',
}: LoadingPainterProps) {
  const [factIndex, setFactIndex] = useState(0)
  const [fading, setFading] = useState(false)

  const advanceFact = useCallback(() => {
    setFading(true)
    // Start the fade-out, then swap text and fade-in
    const swapTimer = setTimeout(() => {
      setFactIndex((prev) => (prev + 1) % FUN_FACTS.length)
      setFading(false)
    }, 300)
    return () => clearTimeout(swapTimer)
  }, [])

  useEffect(() => {
    const interval = setInterval(advanceFact, CYCLE_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [advanceFact])

  const fact = FUN_FACTS[factIndex]

  return (
    <div className={`flex flex-col items-center text-center px-4 py-8 animate-fade-in ${className}`}>
      {/* Mascot */}
      <LottieMascot state="thinking" size="lg" />

      {/* Speech */}
      <div className="mt-4 mb-6">
        <SpeechBubble message="Lottie is painting your art..." variant="default" />
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs mb-6">
        <div className="h-3 rounded-full bg-paper overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-coral via-lavender to-teal animate-progress-fill"
            style={{ width: '5%' }}
          />
        </div>
      </div>

      {/* Fun fact */}
      <div
        className={`mb-6 max-w-sm transition-opacity duration-300 ${
          fading ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="rounded-xl bg-white/70 border border-warm-gray/15 px-4 py-3 shadow-soft">
          <p className="text-xs font-semibold text-lavender-dark mb-1">Did you know?</p>
          <p className="text-sm text-charcoal">
            <span className="mr-1">{fact.emoji}</span>
            {fact.text}
          </p>
        </div>
      </div>

      {/* Token recipe card */}
      {tokens.length > 0 && (
        <div className="w-full max-w-xs rounded-xl bg-white/60 border border-warm-gray/15 px-4 py-3">
          <p className="text-xs font-semibold text-warm-gray mb-2">Your recipe:</p>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {style && (
              <span className="inline-block rounded-full bg-lavender/20 text-lavender-dark px-2.5 py-0.5 text-xs font-semibold">
                {style}
              </span>
            )}
            {tokens.map((token) => (
              <span
                key={token}
                className="inline-block rounded-full bg-coral/10 text-coral-dark px-2.5 py-0.5 text-xs font-semibold"
              >
                {token}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export { LoadingPainter }
