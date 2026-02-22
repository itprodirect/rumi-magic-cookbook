'use client'

export type SpeechBubbleVariant = 'default' | 'excited' | 'tip'

export interface SpeechBubbleProps {
  message: string
  variant?: SpeechBubbleVariant
  className?: string
}

const VARIANT_STYLES: Record<SpeechBubbleVariant, string> = {
  default: 'bg-white/90 border-warm-gray/20',
  excited: 'bg-white/90 border-coral/40 shimmer-gradient animate-shimmer',
  tip: 'bg-lavender-light/40 border-lavender/30',
}

/**
 * A rounded speech bubble with a triangular tail pointing down-left (toward Lottie).
 */
export default function SpeechBubble({
  message,
  variant = 'default',
  className = '',
}: SpeechBubbleProps) {
  return (
    <div className={`relative inline-block animate-fade-in ${className}`}>
      {/* Bubble */}
      <div
        className={`rounded-2xl border px-4 py-3 font-body text-sm text-charcoal shadow-soft ${VARIANT_STYLES[variant]}`}
      >
        {variant === 'tip' && (
          <span className="mr-1.5 text-lavender-dark font-semibold">Tip:</span>
        )}
        {message}
      </div>

      {/* Tail — CSS triangle pointing down-left */}
      <div
        className="absolute -bottom-2 left-6"
        style={{
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: `8px solid ${variant === 'tip' ? '#D4C9F0' : '#ffffff'}`,
        }}
        aria-hidden="true"
      />
    </div>
  )
}

export { SpeechBubble }
