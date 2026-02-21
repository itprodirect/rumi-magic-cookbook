'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { apiFetch, ApiError } from '@/lib/api-client'
import { getOrCreateDeviceId } from '@/lib/device-id'

// --- Types ---

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

// --- Field config matching /api/generate payload shape ---

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
  { field: 'steps', category: 'step', required: false, multi: true, max: 6 },
  { field: 'ingredients', category: 'ingredient', required: false, multi: true, max: 6 },
]

// Step 2 fields: core picks
const CORE_FIELDS = ['theme', 'style', 'palette', 'creature', 'title']
// Step 3 fields: extras
const EXTRAS_FIELDS = ['effects', 'addons']
// Advanced fields (collapsed)
const ADVANCED_FIELDS = ['mood', 'steps', 'ingredients']

const STEP_LABELS = ['Preset', 'Core Picks', 'Extras', 'Review']

type Selections = Record<string, string | string[]>

// --- Reusable field renderers ---

function SingleSelect({
  cfg,
  options,
  value,
  onChange,
}: {
  cfg: FieldConfig
  options: DictItem[]
  value: string
  onChange: (field: string, value: string) => void
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium capitalize text-zinc-300">
        {cfg.field} {cfg.required && <span className="text-amber-400">*</span>}
      </label>
      <select
        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        value={value}
        onChange={(e) => onChange(cfg.field, e.target.value)}
      >
        <option value="">-- Select --</option>
        {options.map((o) => (
          <option key={o.id} value={o.label}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function ChipSelect({
  cfg,
  options,
  selected,
  onToggle,
}: {
  cfg: FieldConfig
  options: DictItem[]
  selected: string[]
  onToggle: (field: string, label: string, max: number) => void
}) {
  const max = cfg.max ?? 3
  return (
    <div>
      <label className="mb-1 block text-sm font-medium capitalize text-zinc-300">
        {cfg.field}{' '}
        <span className="text-xs font-normal text-zinc-500">
          ({selected.length}/{max})
        </span>
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = selected.includes(o.label)
          const full = !active && selected.length >= max
          return (
            <button
              key={o.id}
              type="button"
              disabled={full}
              onClick={() => onToggle(cfg.field, o.label, max)}
              className={`rounded-full border px-3 py-1 text-sm transition ${
                active
                  ? 'border-violet-500 bg-violet-500/20 text-violet-300'
                  : full
                    ? 'cursor-not-allowed border-zinc-800 text-zinc-600'
                    : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
              }`}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// --- Main component ---

export default function BuilderPage() {
  const [items, setItems] = useState<Map<string, DictItem[]>>(new Map())
  const [presets, setPresets] = useState<Preset[]>([])
  const [selections, setSelections] = useState<Selections>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [step, setStep] = useState(0)
  const [advancedOpen, setAdvancedOpen] = useState(false)

  // --- Data loading ---

  useEffect(() => {
    async function load() {
      try {
        const [dictRes, presetRes] = await Promise.all([
          apiFetch<{ items: DictItem[] }>('/api/dictionary'),
          apiFetch<{ presets: Preset[] }>('/api/presets'),
        ])
        const grouped = new Map<string, DictItem[]>()
        for (const item of dictRes.items) {
          const list = grouped.get(item.category) ?? []
          list.push(item)
          grouped.set(item.category, list)
        }
        setItems(grouped)
        setPresets(presetRes.presets)
      } catch (e) {
        const msg = e instanceof ApiError ? e.message : 'Failed to load dictionary'
        setMessage({ type: 'error', text: msg })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // --- Selection helpers ---

  const setSingle = useCallback((field: string, value: string) => {
    setSelections((prev) => {
      const next = { ...prev }
      if (value) {
        next[field] = value
      } else {
        delete next[field]
      }
      return next
    })
  }, [])

  const toggleMulti = useCallback((field: string, label: string, max: number) => {
    setSelections((prev) => {
      const current = (prev[field] as string[] | undefined) ?? []
      const next = current.includes(label)
        ? current.filter((l) => l !== label)
        : current.length < max
          ? [...current, label]
          : current
      return { ...prev, [field]: next }
    })
  }, [])

  const applyPreset = useCallback((preset: Preset) => {
    const next: Selections = {}
    for (const cfg of FIELD_CONFIG) {
      const val = preset.tokenIds[cfg.field]
      if (val !== undefined) {
        next[cfg.field] = val
      }
    }
    setSelections(next)
    setStep(1) // advance to core picks
  }, [])

  const surpriseMe = useCallback(() => {
    if (presets.length === 0) return
    const random = presets[Math.floor(Math.random() * presets.length)]
    applyPreset(random)
  }, [presets, applyPreset])

  // --- Validation ---

  const coreComplete =
    !!selections.palette && !!selections.style && !!selections.theme

  const canAdvance = (s: number): boolean => {
    if (s === 1) return coreComplete
    return true
  }

  // --- Submit ---

  async function handleSubmit() {
    setSubmitting(true)
    setMessage(null)

    try {
      const deviceId = getOrCreateDeviceId()
      const body: Record<string, unknown> = { deviceId }
      for (const cfg of FIELD_CONFIG) {
        const val = selections[cfg.field]
        if (cfg.multi) {
          const arr = val as string[] | undefined
          if (arr && arr.length > 0) body[cfg.field] = arr
        } else {
          if (val) body[cfg.field] = val
        }
      }

      // Default mood if not set (required by API)
      if (!body.mood) {
        const moods = items.get('mood')
        if (moods && moods.length > 0) body.mood = moods[0].label
      }

      const res = await apiFetch<{ id: string; status: string }>(
        '/api/generate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      )
      setMessage({
        type: 'success',
        text: `Recipe submitted! ID: ${res.id.slice(0, 8)}... Ask your parent to approve it!`,
      })
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Something went wrong'
      setMessage({ type: 'error', text: msg })
    } finally {
      setSubmitting(false)
    }
  }

  // --- Render helpers ---

  function renderFieldGroup(fieldNames: string[]) {
    return fieldNames.map((name) => {
      const cfg = FIELD_CONFIG.find((c) => c.field === name)
      if (!cfg) return null
      const options = items.get(cfg.category) ?? []
      if (options.length === 0) return null

      if (cfg.multi) {
        const selected = (selections[cfg.field] as string[] | undefined) ?? []
        return (
          <ChipSelect
            key={cfg.field}
            cfg={cfg}
            options={options}
            selected={selected}
            onToggle={toggleMulti}
          />
        )
      }
      const value = (selections[cfg.field] as string) ?? ''
      return (
        <SingleSelect
          key={cfg.field}
          cfg={cfg}
          options={options}
          value={value}
          onChange={setSingle}
        />
      )
    })
  }

  // --- Loading state ---

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <p className="text-lg text-zinc-500">Loading...</p>
      </div>
    )
  }

  // --- Progress bar ---

  const progressBar = (
    <div className="mb-6">
      <div className="mb-2 flex justify-between">
        {STEP_LABELS.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => {
              if (i < step || (i > step && canAdvance(step))) setStep(i)
            }}
            className={`text-xs font-medium transition ${
              i === step
                ? 'text-violet-400'
                : i < step
                  ? 'cursor-pointer text-zinc-400 hover:text-zinc-200'
                  : 'text-zinc-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-violet-500 transition-all duration-300"
          style={{ width: `${((step + 1) / STEP_LABELS.length) * 100}%` }}
        />
      </div>
    </div>
  )

  // --- Navigation buttons ---

  const navButtons = (
    <div className="mt-6 flex gap-3">
      {step > 0 && (
        <button
          type="button"
          onClick={() => setStep(step - 1)}
          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-500 hover:text-zinc-100"
        >
          Back
        </button>
      )}
      {step < 3 && (
        <button
          type="button"
          onClick={() => setStep(step + 1)}
          disabled={!canAdvance(step)}
          className="ml-auto rounded-lg bg-violet-600 px-5 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-40"
        >
          Next
        </button>
      )}
    </div>
  )

  return (
    <div className="mx-auto min-h-screen max-w-xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold text-zinc-100">
        Rumi Magic Cookbook
      </h1>
      <p className="mb-6 text-sm text-zinc-500">
        Build your magic recipe card in a few steps!
      </p>

      {progressBar}

      {/* ---- Step 0: Preset ---- */}
      {step === 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-zinc-200">
            Pick a preset or start fresh
          </h2>

          <button
            type="button"
            onClick={surpriseMe}
            className="mb-4 w-full rounded-lg border-2 border-dashed border-violet-600 py-3 text-center font-medium text-violet-400 transition hover:border-violet-400 hover:text-violet-300"
          >
            Surprise Me!
          </button>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {presets.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p)}
                className="rounded-lg border border-zinc-700 p-3 text-left transition hover:border-violet-500 hover:bg-zinc-800/50"
              >
                <span className="block text-sm font-medium text-zinc-200">
                  {p.name}
                </span>
                <span className="mt-1 block text-xs text-zinc-500 line-clamp-2">
                  {p.description}
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setStep(1)}
            className="mt-4 w-full rounded-lg border border-zinc-700 py-2 text-sm text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
          >
            Skip — build from scratch
          </button>
        </section>
      )}

      {/* ---- Step 1: Core Picks ---- */}
      {step === 1 && (
        <section className="space-y-4">
          <h2 className="mb-1 text-lg font-semibold text-zinc-200">
            Core Picks
          </h2>
          <p className="mb-3 text-xs text-zinc-500">
            Theme, Style, and Palette are required.
          </p>
          {renderFieldGroup(CORE_FIELDS)}
        </section>
      )}

      {/* ---- Step 2: Extras ---- */}
      {step === 2 && (
        <section className="space-y-4">
          <h2 className="mb-1 text-lg font-semibold text-zinc-200">
            Extras
          </h2>
          <p className="mb-3 text-xs text-zinc-500">
            Add effects and addons to spice things up. All optional!
          </p>
          {renderFieldGroup(EXTRAS_FIELDS)}

          {/* Advanced collapse */}
          <div className="mt-4 border-t border-zinc-800 pt-4">
            <button
              type="button"
              onClick={() => setAdvancedOpen(!advancedOpen)}
              className="flex w-full items-center justify-between text-sm font-medium text-zinc-400 hover:text-zinc-200"
            >
              <span>Advanced Options</span>
              <span className="text-xs">{advancedOpen ? '▲' : '▼'}</span>
            </button>
            {advancedOpen && (
              <div className="mt-3 space-y-4">
                {renderFieldGroup(ADVANCED_FIELDS)}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ---- Step 3: Review ---- */}
      {step === 3 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-zinc-200">
            Review Your Recipe
          </h2>

          <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
            {FIELD_CONFIG.map((cfg) => {
              const val = selections[cfg.field]
              if (!val) return null
              const display = Array.isArray(val) ? val.join(', ') : val
              if (!display) return null
              return (
                <div key={cfg.field} className="flex justify-between py-1">
                  <span className="text-sm capitalize text-zinc-400">
                    {cfg.field}
                  </span>
                  <span className="text-sm text-zinc-200">{display}</span>
                </div>
              )
            })}
            {/* Show default mood if none selected */}
            {!selections.mood && (
              <div className="flex justify-between py-1">
                <span className="text-sm text-zinc-400">mood</span>
                <span className="text-sm text-zinc-500 italic">
                  {items.get('mood')?.[0]?.label ?? 'auto'}
                </span>
              </div>
            )}
          </div>

          {!coreComplete && (
            <p className="mt-3 text-sm text-amber-400">
              Missing required fields. Go back to fill in Theme, Style, and Palette.
            </p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !coreComplete}
            className="mt-4 w-full rounded-lg bg-violet-600 py-3 font-medium text-white transition hover:bg-violet-500 disabled:opacity-40"
          >
            {submitting ? 'Submitting...' : 'Create Recipe Card!'}
          </button>
        </section>
      )}

      {navButtons}

      {message && (
        <div
          className={`mt-4 rounded-lg p-3 text-sm ${
            message.type === 'success'
              ? 'bg-green-900/30 text-green-400'
              : 'bg-red-900/30 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="mt-8 flex justify-center gap-4 text-sm">
        <Link href="/gallery" className="text-violet-400 hover:text-violet-300">
          View Gallery
        </Link>
        <Link href="/admin" className="text-zinc-500 hover:text-zinc-300">
          Admin
        </Link>
      </div>
    </div>
  )
}
