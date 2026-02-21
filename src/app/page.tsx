'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { apiFetch, ApiError } from '@/lib/api-client'
import { getOrCreateDeviceId } from '@/lib/device-id'

// --- Types matching API responses ---

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

// --- Field config: maps UI fields to dictionary categories + generate API shape ---

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

type Selections = Record<string, string | string[]>

export default function BuilderPage() {
  const [items, setItems] = useState<Map<string, DictItem[]>>(new Map())
  const [presets, setPresets] = useState<Preset[]>([])
  const [selections, setSelections] = useState<Selections>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setMessage(null)

    try {
      const deviceId = getOrCreateDeviceId()

      // Build body matching exact API shape
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
        text: `Recipe submitted! ID: ${res.id.slice(0, 8)}... Status: ${res.status}`,
      })
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Something went wrong'
      setMessage({ type: 'error', text: msg })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-zinc-500">Loading dictionary...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">Rumi Magic Cookbook</h1>
      <p className="mb-6 text-zinc-500">Pick your ingredients to create a magic recipe card!</p>

      {/* Preset selector */}
      {presets.length > 0 && (
        <div className="mb-6">
          <label className="mb-1 block text-sm font-medium">Quick Preset</label>
          <select
            className="w-full rounded border border-zinc-300 px-3 py-2"
            defaultValue=""
            onChange={(e) => {
              const p = presets.find((pr) => pr.id === e.target.value)
              if (p) applyPreset(p)
            }}
          >
            <option value="">— Choose a preset —</option>
            {presets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.description}
              </option>
            ))}
          </select>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {FIELD_CONFIG.map((cfg) => {
          const options = items.get(cfg.category) ?? []
          if (options.length === 0) return null

          if (!cfg.multi) {
            // Single select (dropdown)
            const value = (selections[cfg.field] as string) ?? ''
            return (
              <div key={cfg.field}>
                <label className="mb-1 block text-sm font-medium capitalize">
                  {cfg.field} {cfg.required && <span className="text-red-500">*</span>}
                </label>
                <select
                  className="w-full rounded border border-zinc-300 px-3 py-2"
                  value={value}
                  onChange={(e) => setSingle(cfg.field, e.target.value)}
                  required={cfg.required}
                >
                  <option value="">— Select —</option>
                  {options.map((o) => (
                    <option key={o.id} value={o.label}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            )
          }

          // Multi select (checkboxes)
          const selected = (selections[cfg.field] as string[] | undefined) ?? []
          const max = cfg.max ?? 3
          return (
            <div key={cfg.field}>
              <label className="mb-1 block text-sm font-medium capitalize">
                {cfg.field} (max {max})
              </label>
              <div className="flex flex-wrap gap-2">
                {options.map((o) => {
                  const checked = selected.includes(o.label)
                  const disabled = !checked && selected.length >= max
                  return (
                    <label
                      key={o.id}
                      className={`inline-flex cursor-pointer items-center rounded border px-2 py-1 text-sm ${
                        checked
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : disabled
                            ? 'cursor-not-allowed border-zinc-200 text-zinc-400'
                            : 'border-zinc-300 hover:border-zinc-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => toggleMulti(cfg.field, o.label, max)}
                      />
                      {o.label}
                    </label>
                  )
                })}
              </div>
            </div>
          )
        })}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Create Recipe Card'}
        </button>
      </form>

      {message && (
        <div
          className={`mt-4 rounded p-3 text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="mt-6 text-center">
        <Link href="/gallery" className="text-blue-600 hover:underline">
          View Gallery
        </Link>
        {' · '}
        <Link href="/admin" className="text-zinc-500 hover:underline">
          Admin
        </Link>
      </div>
    </div>
  )
}
