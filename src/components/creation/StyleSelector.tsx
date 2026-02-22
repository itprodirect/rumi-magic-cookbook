'use client'

import { EMOJI_MAP } from '@/lib/constants/token-chips'

export interface StyleOption {
  /** DB label (matches DictionaryItem.label for category 'style') */
  label: string
  /** Emoji for visual flair */
  emoji: string
  /** CSS gradient or pattern for the preview card */
  previewClass: string
}

/**
 * Maps each DB style label to a visual preview.
 * Labels must match exactly what's in the dictionary.
 */
const STYLE_VISUALS: Record<string, string> = {
  'Watercolor Sparkle': 'bg-gradient-to-br from-coral-light/60 via-sky/40 to-lavender-light/60',
  'Kawaii Sticker': 'bg-gradient-to-br from-coral-light/70 to-golden/50',
  'Storybook': 'bg-gradient-to-br from-paper to-cream border-2 border-warm-gray/30',
  'Neon Cartoon': 'bg-gradient-to-br from-charcoal to-charcoal/90 ring-1 ring-teal/60',
  'Neon Sign': 'bg-gradient-to-br from-charcoal to-lavender-dark/80 ring-1 ring-coral/50',
  '3D Toy': 'bg-gradient-to-br from-sky/50 to-teal-light/40',
  'Glitter Gel-Pen': 'bg-gradient-to-br from-lavender-light/60 to-coral-light/50',
  'Kids Game UI': 'bg-gradient-to-br from-golden/50 to-leaf/40',
  'Magical Postcard': 'bg-gradient-to-br from-lavender-light/40 to-cream',
  'Candy-Coated': 'bg-gradient-to-br from-coral-light/50 via-golden/30 to-teal-light/40',
}

export interface StyleSelectorProps {
  /** Available style labels (from DB dictionary) */
  styles: string[]
  /** Currently selected style label, or null */
  selectedStyle: string | null
  /** Called when a style is selected */
  onSelect: (style: string) => void
}

export default function StyleSelector({
  styles,
  selectedStyle,
  onSelect,
}: StyleSelectorProps) {
  return (
    <div className="animate-fade-in">
      <h3 className="font-display text-base font-semibold text-charcoal mb-3">
        🖌️ Art Style
      </h3>

      <div className="flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible scrollbar-none -mx-1 px-1">
        {styles.map((label) => {
          const isSelected = selectedStyle === label
          const previewClass = STYLE_VISUALS[label] ?? 'bg-gradient-to-br from-warm-gray/20 to-paper'
          const emoji = EMOJI_MAP[label] ?? '🖌️'

          return (
            <button
              key={label}
              type="button"
              onClick={() => onSelect(label)}
              aria-pressed={isSelected}
              className={`relative flex-shrink-0 w-[140px] md:w-full rounded-2xl overflow-hidden transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 ${
                isSelected
                  ? 'ring-2 ring-coral shadow-hover scale-[1.03]'
                  : 'opacity-75 hover:opacity-100 hover:shadow-soft'
              }`}
            >
              {/* Preview area */}
              <div
                className={`h-20 md:h-24 w-full flex items-center justify-center text-3xl ${previewClass}`}
              >
                <span aria-hidden="true">{emoji}</span>
              </div>

              {/* Label */}
              <div className={`px-3 py-2 text-center text-xs font-semibold transition-colors ${
                isSelected
                  ? 'bg-coral/10 text-coral-dark'
                  : 'bg-white/80 text-charcoal'
              }`}>
                {label}
              </div>

              {/* Selected checkmark badge */}
              {isSelected && (
                <div className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-coral text-white flex items-center justify-center text-xs font-bold shadow-soft">
                  ✓
                </div>
              )}
            </button>
          )
        })}
      </div>

      {styles.length === 0 && (
        <p className="text-sm text-warm-gray py-4 text-center">
          Loading styles...
        </p>
      )}
    </div>
  )
}

export { StyleSelector }
