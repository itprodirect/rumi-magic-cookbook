'use client'

import { useState, useRef, useEffect } from 'react'
import {
  type TokenChip,
  type VisualCategory,
  CATEGORY_TABS,
} from '@/lib/constants/token-chips'

export interface TokenPickerProps {
  /** All available chips (grouped by visual category) */
  chips: TokenChip[]
  /** Currently selected chips */
  selectedTokens: TokenChip[]
  /** Toggle a chip on/off */
  onToggle: (chip: TokenChip) => void
  /** Max total selections allowed */
  maxTokens?: number
  /** Called when user tries to exceed max */
  onMaxReached?: () => void
}

const MAX_DEFAULT = 6

export default function TokenPicker({
  chips,
  selectedTokens,
  onToggle,
  maxTokens = MAX_DEFAULT,
  onMaxReached,
}: TokenPickerProps) {
  const [activeTab, setActiveTab] = useState<VisualCategory>('subject')
  const tabsRef = useRef<HTMLDivElement>(null)

  // Scroll active tab into view on mobile
  useEffect(() => {
    if (!tabsRef.current) return
    const activeEl = tabsRef.current.querySelector('[data-active="true"]')
    activeEl?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [activeTab])

  const selectedIds = new Set(selectedTokens.map((t) => t.id))
  const activeCategory = CATEGORY_TABS.find((t) => t.id === activeTab)!
  const visibleChips = chips.filter((c) => c.category === activeTab)
  const atLimit = selectedTokens.length >= maxTokens

  function handleToggle(chip: TokenChip) {
    const isSelected = selectedIds.has(chip.id)
    if (!isSelected && atLimit) {
      onMaxReached?.()
      return
    }
    onToggle(chip)
  }

  return (
    <div className="animate-fade-in">
      {/* ── Tab bar ── */}
      <div
        ref={tabsRef}
        className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none -mx-1 px-1"
        role="tablist"
        aria-label="Token categories"
      >
        {CATEGORY_TABS.map((tab) => {
          const isActive = tab.id === activeTab
          const count = selectedTokens.filter((t) => t.category === tab.id).length
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              data-active={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold transition-all min-h-[44px] ${
                isActive
                  ? `${tab.activeBg} ${tab.activeBorder} ${tab.activeColor} border shadow-soft`
                  : 'bg-white/60 border border-warm-gray/20 text-warm-gray hover:border-warm-gray/40 hover:text-charcoal'
              }`}
            >
              <span aria-hidden="true">{tab.emoji}</span>
              <span>{tab.label}</span>
              {count > 0 && (
                <span className={`inline-flex items-center justify-center h-5 min-w-5 rounded-full text-xs font-bold ${
                  isActive ? 'bg-white/50 text-current' : 'bg-warm-gray/20 text-warm-gray'
                }`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Selection count ── */}
      <p className="text-xs text-warm-gray mb-3">
        {selectedTokens.length}/{maxTokens} ingredients picked
      </p>

      {/* ── Chip grid ── */}
      <div
        id={`panel-${activeTab}`}
        role="tabpanel"
        aria-label={`${activeCategory.label} tokens`}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2"
      >
        {visibleChips.map((chip) => {
          const isSelected = selectedIds.has(chip.id)
          const isDisabled = !isSelected && atLimit

          return (
            <button
              key={chip.id}
              type="button"
              disabled={isDisabled}
              onClick={() => handleToggle(chip)}
              className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all min-h-[48px] border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-1 ${
                isSelected
                  ? `${activeCategory.activeBg} ${activeCategory.activeBorder} ${activeCategory.activeColor} animate-chip-pop shadow-soft`
                  : isDisabled
                    ? 'bg-white/40 border-warm-gray/10 text-warm-gray/40 cursor-not-allowed'
                    : 'bg-white/70 border-warm-gray/20 text-charcoal hover:border-warm-gray/40 hover:shadow-soft btn-bounce'
              }`}
            >
              <span className="text-lg flex-shrink-0" aria-hidden="true">
                {chip.emoji}
              </span>
              <span className="truncate">{chip.label}</span>
              {isSelected && (
                <span className="ml-auto text-xs opacity-60" aria-hidden="true">✓</span>
              )}
            </button>
          )
        })}

        {visibleChips.length === 0 && (
          <p className="col-span-full text-sm text-warm-gray py-4 text-center">
            No tokens available in this category.
          </p>
        )}
      </div>
    </div>
  )
}

export { TokenPicker }
