'use client'

import { type TokenChip, CATEGORY_TABS, EMOJI_MAP } from '@/lib/constants/token-chips'

export interface RecipePreviewProps {
  /** Selected token chips */
  tokens: TokenChip[]
  /** Selected art style label, or null */
  style: string | null
  /** Selected palette label, or null */
  palette: string | null
  /** Called when a token chip is removed */
  onRemoveToken: (chip: TokenChip) => void
  /** Called when the style is removed */
  onRemoveStyle: () => void
  /** Called when the palette is removed */
  onRemovePalette: () => void
}

export default function RecipePreview({
  tokens,
  style,
  palette,
  onRemoveToken,
  onRemoveStyle,
  onRemovePalette,
}: RecipePreviewProps) {
  const hasAnything = tokens.length > 0 || style || palette

  return (
    <div className="rounded-2xl border border-warm-gray/15 bg-white/70 p-4 shadow-soft rotate-[0.5deg] animate-fade-in">
      <h3 className="font-display text-base font-semibold text-charcoal mb-3">
        Your Magic Recipe 🧪
      </h3>

      {!hasAnything ? (
        <p className="text-sm text-warm-gray italic py-2">
          Pick some ingredients to start!
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {/* Style badge */}
          {style && (
            <RecipeBadge
              emoji={EMOJI_MAP[style] ?? '🖌️'}
              label={style}
              colorClass="bg-lavender/20 text-lavender-dark border-lavender/30"
              onRemove={onRemoveStyle}
            />
          )}

          {/* Palette badge */}
          {palette && (
            <RecipeBadge
              emoji={EMOJI_MAP[palette] ?? '🎨'}
              label={palette}
              colorClass="bg-sky/15 text-sky border-sky/30"
              onRemove={onRemovePalette}
            />
          )}

          {/* Token chips */}
          {tokens.map((chip) => {
            const tab = CATEGORY_TABS.find((t) => t.id === chip.category)
            return (
              <RecipeBadge
                key={chip.id}
                emoji={chip.emoji}
                label={chip.label}
                colorClass={`${tab?.activeBg ?? 'bg-warm-gray/10'} ${tab?.activeColor ?? 'text-charcoal'} ${tab?.activeBorder ?? 'border-warm-gray/20'}`}
                onRemove={() => onRemoveToken(chip)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

function RecipeBadge({
  emoji,
  label,
  colorClass,
  onRemove,
}: {
  emoji: string
  label: string
  colorClass: string
  onRemove: () => void
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-all animate-chip-pop ${colorClass}`}
    >
      <span aria-hidden="true">{emoji}</span>
      <span className="max-w-[100px] truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 hover:opacity-70 transition-opacity focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-coral rounded-full"
        aria-label={`Remove ${label}`}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </span>
  )
}

export { RecipePreview }
