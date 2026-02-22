'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { apiFetch, ApiError } from '@/lib/api-client'
import { getOrCreateDeviceId } from '@/lib/device-id'
import {
  type TokenChip,
  dictItemToChip,
  EMOJI_MAP,
  DEFAULT_EMOJI,
} from '@/lib/constants/token-chips'

import { LottieMascot } from '@/components/mascot/LottieMascot'
import { SpeechBubble } from '@/components/mascot/SpeechBubble'
import { TokenPicker } from '@/components/creation/TokenPicker'
import { StyleSelector } from '@/components/creation/StyleSelector'
import { RecipePreview } from '@/components/creation/RecipePreview'
import { CreateButton } from '@/components/creation/CreateButton'
import { LoadingPainter } from '@/components/feedback/LoadingPainter'
import { ConfettiBurst } from '@/components/feedback/ConfettiBurst'
import { Toast } from '@/components/feedback/Toast'

// ── Types (match API shape) ──

interface DictItem {
  id: string
  category: string
  label: string
  tags: string[]
}

interface Preset {
  id: string
  name: string
  description: string
  tokenIds: Record<string, string | string[]>
}

// ── Field config for API submission ──

interface FieldConfig {
  field: string
  category: string
  required: boolean
  multi: boolean
  max?: number
}

const FIELD_CONFIG: FieldConfig[] = [
  { field: 'palette', category: 'palette', required: true, multi: false },
  { field: 'style', category: 'style', required: true, multi: false },
  { field: 'theme', category: 'theme', required: true, multi: false },
  { field: 'mood', category: 'mood', required: true, multi: false },
  { field: 'title', category: 'title', required: false, multi: false },
  { field: 'creature', category: 'creature', required: false, multi: false },
  { field: 'effects', category: 'effect', required: false, multi: true, max: 3 },
  { field: 'addons', category: 'addon', required: false, multi: true, max: 3 },
]

// ── Page state ──

type PageView = 'build' | 'loading' | 'success'

// ── Component ──

export default function BuilderPage() {
  // Data from API
  const [dictItems, setDictItems] = useState<DictItem[]>([])
  const [presets, setPresets] = useState<Preset[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  // User selections
  const [selectedTokens, setSelectedTokens] = useState<TokenChip[]>([])
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)
  const [selectedPalette, setSelectedPalette] = useState<string | null>(null)

  // Page state
  const [view, setView] = useState<PageView>('build')
  const [submitting, setSubmitting] = useState(false)

  // Feedback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; visible: boolean }>({
    message: '',
    type: 'info',
    visible: false,
  })
  const [showConfetti, setShowConfetti] = useState(false)

  const [dataError, setDataError] = useState<string | null>(null)

  // ── Data loading ──

  async function loadData() {
    setDataLoading(true)
    setDataError(null)
    try {
      const [dictRes, presetRes] = await Promise.all([
        apiFetch<{ items: DictItem[] }>('/api/dictionary'),
        apiFetch<{ presets: Preset[] }>('/api/presets'),
      ])
      setDictItems(dictRes.items)
      setPresets(presetRes.presets)
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Failed to load — please refresh!'
      setDataError(msg)
    } finally {
      setDataLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Derived data ──

  // Convert DB items to visual TokenChips for the picker
  // (only creature, theme, mood, palette, effect, addon — not style, which uses StyleSelector)
  const allChips = useMemo(() => {
    return dictItems
      .map(dictItemToChip)
      .filter((c): c is TokenChip => c !== null)
  }, [dictItems])

  // Style labels (fetched from DB, shown in StyleSelector)
  const styleLabels = useMemo(() => {
    return dictItems
      .filter((item) => item.category === 'style')
      .map((item) => item.label)
  }, [dictItems])

  // Palette labels (for default fallback)
  const paletteLabels = useMemo(() => {
    return dictItems
      .filter((item) => item.category === 'palette')
      .map((item) => item.label)
  }, [dictItems])

  // Mood labels (for default fallback)
  const moodLabels = useMemo(() => {
    return dictItems
      .filter((item) => item.category === 'mood')
      .map((item) => item.label)
  }, [dictItems])

  // ── Toast helper ──

  function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    setToast({ message, type, visible: true })
  }

  // ── Token selection handlers ──

  const handleTokenToggle = useCallback((chip: TokenChip) => {
    setSelectedTokens((prev) => {
      const exists = prev.find((t) => t.id === chip.id)
      if (exists) {
        // If this is a single-select field, just remove
        return prev.filter((t) => t.id !== chip.id)
      }

      // For single-select DB fields (creature, theme, mood), replace any existing from same apiField
      if (!chip.isMulti) {
        const filtered = prev.filter((t) => t.apiField !== chip.apiField)
        return [...filtered, chip]
      }

      // For multi-select, check max per field
      const fieldCfg = FIELD_CONFIG.find((f) => f.field === chip.apiField)
      const maxForField = fieldCfg?.max ?? 3
      const currentFieldCount = prev.filter((t) => t.apiField === chip.apiField).length
      if (currentFieldCount >= maxForField) {
        return prev // caller handles the max-reached toast
      }

      return [...prev, chip]
    })
  }, [])

  const handleRemoveToken = useCallback((chip: TokenChip) => {
    setSelectedTokens((prev) => prev.filter((t) => t.id !== chip.id))
  }, [])

  const handleStyleSelect = useCallback((style: string) => {
    setSelectedStyle((prev) => (prev === style ? null : style))
  }, [])

  const handleRemoveStyle = useCallback(() => {
    setSelectedStyle(null)
  }, [])

  const handleRemovePalette = useCallback(() => {
    setSelectedPalette(null)
  }, [])

  const handleMaxReached = useCallback(() => {
    showToast('You\'ve picked the max ingredients! Remove one to add something new.', 'info')
  }, [])

  // ── Preset application ──

  const applyPreset = useCallback((preset: Preset) => {
    const newTokens: TokenChip[] = []
    const ids = preset.tokenIds

    // Map preset token labels to chips
    for (const [field, value] of Object.entries(ids)) {
      if (field === 'style') {
        setSelectedStyle(value as string)
        continue
      }
      if (field === 'palette') {
        setSelectedPalette(value as string)
        continue
      }

      const values = Array.isArray(value) ? value : [value]
      for (const label of values) {
        const chip = allChips.find(
          (c) => c.label === label && c.apiField === field
        ) ?? allChips.find(
          (c) => c.label === label
        )
        if (chip) newTokens.push(chip)
      }
    }

    setSelectedTokens(newTokens)
    showToast(`Applied "${preset.name}" preset!`, 'success')
  }, [allChips])

  const surpriseMe = useCallback(() => {
    if (presets.length === 0) return
    const random = presets[Math.floor(Math.random() * presets.length)]
    applyPreset(random)
  }, [presets, applyPreset])

  // ── Validation ──

  // We need: at least one creature or theme token + a style
  const hasSubjectOrSetting = selectedTokens.some(
    (t) => t.category === 'subject' || t.category === 'setting'
  )
  const canCreate = hasSubjectOrSetting && !!selectedStyle

  // ── Submit ──

  async function handleSubmit() {
    if (!canCreate) return

    setSubmitting(true)
    setView('loading')

    try {
      const deviceId = getOrCreateDeviceId()
      const body: Record<string, unknown> = { deviceId }

      // Set style
      body.style = selectedStyle

      // Set palette (from explicit selection or from selected token, or fallback)
      const paletteToken = selectedPalette ?? selectedTokens.find((t) => t.apiField === 'palette')?.label
      body.palette = paletteToken ?? paletteLabels[0] ?? 'Rainbow'

      // Build API fields from selected tokens
      for (const chip of selectedTokens) {
        if (chip.apiField === 'palette') continue // handled above

        const cfg = FIELD_CONFIG.find((f) => f.field === chip.apiField)
        if (!cfg) continue

        if (cfg.multi) {
          const current = (body[cfg.field] as string[] | undefined) ?? []
          body[cfg.field] = [...current, chip.label]
        } else {
          body[cfg.field] = chip.label
        }
      }

      // Default mood if not set (required by API)
      if (!body.mood) {
        const moodToken = selectedTokens.find((t) => t.apiField === 'mood')
        body.mood = moodToken?.label ?? moodLabels[0] ?? 'Happy'
      }

      // Default theme if not set (required by API)
      if (!body.theme) {
        const themeToken = selectedTokens.find((t) => t.apiField === 'theme')
        body.theme = themeToken?.label ?? 'Magic Cookbook'
      }

      await apiFetch<{ id: string; status: string }>(
        '/api/generate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      )

      // Success!
      setView('success')
      setShowConfetti(true)
      showToast('Recipe submitted! Ask your parent to approve it!', 'success')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Something went wrong — try again!'
      showToast(msg, 'error')
      setView('build')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Reset for new creation ──

  function handleCreateAnother() {
    setSelectedTokens([])
    setSelectedStyle(null)
    setSelectedPalette(null)
    setView('build')
    setShowConfetti(false)
  }

  // ── Token labels for the loading screen ──

  const tokenLabelsForLoader = selectedTokens.map((t) => t.label)

  // ── Render: Loading ──

  if (dataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <LottieMascot state="thinking" size="md" />
        <p className="text-warm-gray font-display text-lg">Loading your studio...</p>
      </div>
    )
  }

  // ── Render: Data load error ──

  if (dataError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 text-center animate-fade-in">
        <LottieMascot state="sleeping" size="md" />
        <SpeechBubble message="Oops! Something went wrong loading the studio." variant="default" />
        <p className="text-sm text-warm-gray max-w-xs">{dataError}</p>
        <button
          type="button"
          onClick={() => loadData()}
          className="mt-2 min-h-[48px] rounded-xl bg-coral px-6 text-white font-display font-semibold transition hover:bg-coral-dark btn-bounce"
        >
          Try Again
        </button>
      </div>
    )
  }

  // ── Render: Generation in progress ──

  if (view === 'loading') {
    return (
      <>
        <Toast {...toast} onClose={() => setToast((t) => ({ ...t, visible: false }))} />
        <LoadingPainter
          tokens={tokenLabelsForLoader}
          style={selectedStyle ?? undefined}
        />
      </>
    )
  }

  // ── Render: Success ──

  if (view === 'success') {
    return (
      <>
        <ConfettiBurst trigger={showConfetti} onComplete={() => setShowConfetti(false)} />
        <Toast {...toast} onClose={() => setToast((t) => ({ ...t, visible: false }))} />
        <div className="flex flex-col items-center text-center px-4 py-12 animate-fade-in">
          <LottieMascot state="celebrating" size="lg" />
          <div className="mt-4">
            <SpeechBubble message="Your art is on its way! Ask a grown-up to approve it." variant="excited" />
          </div>
          <div className="mt-8 flex flex-col gap-3 w-full max-w-xs">
            <button
              type="button"
              onClick={handleCreateAnother}
              className="w-full min-h-[48px] rounded-xl bg-coral text-white font-display font-semibold transition hover:bg-coral-dark btn-bounce"
            >
              🎨 Create Another!
            </button>
            <Link
              href="/gallery"
              className="w-full min-h-[48px] rounded-xl border-2 border-coral text-coral font-display font-semibold flex items-center justify-center transition hover:bg-coral/10"
            >
              🖼️ View Gallery
            </Link>
          </div>
        </div>
      </>
    )
  }

  // ── Render: Build mode ──

  return (
    <>
      <Toast {...toast} onClose={() => setToast((t) => ({ ...t, visible: false }))} />

      <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        {/* ── Hero: Mascot + greeting ── */}
        <div className="flex items-start gap-3 animate-fade-in">
          <LottieMascot state="painting" size="sm" />
          <div className="pt-1">
            <SpeechBubble message="What shall we paint today?" />
          </div>
        </div>

        {/* ── Preset quick picks ── */}
        <section className="animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-base font-semibold text-charcoal">
              ⚡ Quick Start
            </h2>
            <button
              type="button"
              onClick={surpriseMe}
              className="text-xs font-semibold text-coral hover:text-coral-dark transition btn-bounce"
            >
              🎲 Surprise Me!
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
            {presets.slice(0, 8).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p)}
                className="flex-shrink-0 w-[130px] rounded-xl border border-warm-gray/20 bg-white/70 p-2.5 text-left transition hover:border-coral hover:shadow-soft btn-bounce"
              >
                <span className="block text-xs font-semibold text-charcoal truncate">
                  {p.name}
                </span>
                <span className="mt-0.5 block text-[10px] text-warm-gray line-clamp-2">
                  {p.description}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* ── Recipe preview ── */}
        <RecipePreview
          tokens={selectedTokens}
          style={selectedStyle}
          palette={selectedPalette}
          onRemoveToken={handleRemoveToken}
          onRemoveStyle={handleRemoveStyle}
          onRemovePalette={handleRemovePalette}
        />

        {/* ── Token picker ── */}
        <section>
          <h2 className="font-display text-base font-semibold text-charcoal mb-1">
            🧪 Pick Your Ingredients
          </h2>
          <TokenPicker
            chips={allChips}
            selectedTokens={selectedTokens}
            onToggle={handleTokenToggle}
            maxTokens={8}
            onMaxReached={handleMaxReached}
          />
        </section>

        {/* ── Palette quick picks (if none selected via token picker) ── */}
        {!selectedPalette && !selectedTokens.some((t) => t.apiField === 'palette') && (
          <section className="animate-fade-in">
            <h3 className="font-display text-base font-semibold text-charcoal mb-3">
              🎨 Color Palette
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
              {paletteLabels.map((label) => {
                const isSelected = selectedPalette === label
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setSelectedPalette(isSelected ? null : label)}
                    className={`flex-shrink-0 flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold border transition min-h-[40px] ${
                      isSelected
                        ? 'bg-sky/15 border-sky text-charcoal shadow-soft'
                        : 'bg-white/60 border-warm-gray/20 text-charcoal hover:border-warm-gray/40'
                    }`}
                  >
                    <span aria-hidden="true">{EMOJI_MAP[label] ?? DEFAULT_EMOJI.palette}</span>
                    {label}
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Style selector ── */}
        <StyleSelector
          styles={styleLabels}
          selectedStyle={selectedStyle}
          onSelect={handleStyleSelect}
        />

        {/* ── Create button ── */}
        <div className="pt-2 pb-4 relative">
          <CreateButton
            disabled={!canCreate}
            loading={submitting}
            onClick={handleSubmit}
          />
        </div>

        {/* ── Footer links ── */}
        <div className="flex justify-center gap-4 text-sm pt-2 pb-4">
          <Link href="/gallery" className="text-coral hover:text-coral-dark font-semibold transition">
            View Gallery
          </Link>
          <Link href="/parent" className="text-warm-gray hover:text-charcoal transition">
            Parent Login
          </Link>
        </div>
      </div>
    </>
  )
}
