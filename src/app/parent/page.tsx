'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { apiFetch, ApiError } from '@/lib/api-client'
import { LottieMascot } from '@/components/mascot/LottieMascot'

// --- Types ---

interface Generation {
  id: string
  deviceId: string
  tokenIds: Record<string, string | string[]>
  status: string
  createdAt: string
}

interface Suggestion {
  id: string
  deviceId: string
  phrase: string
  category: string | null
  status: string
  createdAt: string
}

interface QueueData {
  generations: Generation[]
  suggestions: Suggestion[]
}

// --- Helpers ---

function resolveTokenLabels(
  tokenIds: Record<string, string | string[]>
): string {
  const parts: string[] = []
  for (const [key, val] of Object.entries(tokenIds)) {
    if (Array.isArray(val)) {
      if (val.length > 0) parts.push(`${key}: ${val.join(', ')}`)
    } else {
      parts.push(`${key}: ${val}`)
    }
  }
  return parts.join(' · ')
}

// --- Component ---

export default function ParentPage() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [pin, setPin] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loginLoading, setLoginLoading] = useState(false)

  const [queue, setQueue] = useState<QueueData | null>(null)
  const [queueLoading, setQueueLoading] = useState(false)
  const [queueError, setQueueError] = useState<string | null>(null)

  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // --- Login ---

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError(null)

    try {
      await apiFetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      })
      setLoggedIn(true)
      setPin('')
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Login failed'
      setLoginError(msg)
    } finally {
      setLoginLoading(false)
    }
  }

  // --- Queue ---

  const fetchQueue = useCallback(async () => {
    setQueueLoading(true)
    setQueueError(null)

    try {
      const data = await apiFetch<QueueData>('/api/admin/queue')
      setQueue(data)
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setLoggedIn(false)
        setQueueError(null)
        return
      }
      const msg = e instanceof ApiError ? e.message : 'Failed to load queue'
      setQueueError(msg)
    } finally {
      setQueueLoading(false)
    }
  }, [])

  useEffect(() => {
    if (loggedIn) fetchQueue()
  }, [loggedIn, fetchQueue])

  // --- Actions ---

  async function handleApprove(id: string) {
    setActionLoading(id)
    try {
      const res = await apiFetch<{ id: string; status: string; reason?: string }>(
        '/api/admin/approve',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        }
      )
      if (res.status === 'rejected') {
        alert(`Auto-rejected: ${res.reason ?? 'safety check failed'}`)
      }
      await fetchQueue()
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setLoggedIn(false)
        return
      }
      const msg = e instanceof ApiError ? e.message : 'Approve failed'
      alert(msg)
    } finally {
      setActionLoading(null)
    }
  }

  async function handleReject(id: string, type?: 'suggestion') {
    setActionLoading(id)
    try {
      await apiFetch('/api/admin/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(type ? { id, type } : { id }),
      })
      await fetchQueue()
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setLoggedIn(false)
        return
      }
      const msg = e instanceof ApiError ? e.message : 'Reject failed'
      alert(msg)
    } finally {
      setActionLoading(null)
    }
  }

  // --- Logout ---

  async function handleLogout() {
    try {
      await apiFetch('/api/admin/logout', { method: 'POST' })
    } catch {
      // ignore errors on logout
    }
    setLoggedIn(false)
    setQueue(null)
  }

  // --- Render: Login ---

  if (!loggedIn) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16">
        <h1 className="mb-6 text-2xl font-bold text-center font-display text-charcoal">
          Parent Login
        </h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="password"
            placeholder="Enter PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full rounded-xl border border-warm-gray/30 bg-white px-3 py-3 text-center text-lg tracking-widest focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral"
            autoFocus
          />
          <button
            type="submit"
            disabled={loginLoading || !pin}
            className="w-full rounded-xl bg-coral py-3 font-display font-semibold text-white hover:bg-coral-dark disabled:opacity-50 transition btn-bounce"
          >
            {loginLoading ? 'Verifying...' : 'Login'}
          </button>
        </form>
        {loginError && (
          <div className="mt-4 rounded-xl bg-coral/10 p-3 text-sm text-coral-dark text-center font-medium">
            {loginError}
          </div>
        )}
        <div className="mt-6 text-center">
          <Link href="/kid" className="text-warm-gray hover:text-charcoal text-sm transition">
            Back to builder
          </Link>
        </div>
      </div>
    )
  }

  // --- Render: Queue ---

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display text-charcoal">Admin Queue</h1>
        <div className="flex gap-2">
          <button
            onClick={fetchQueue}
            disabled={queueLoading}
            className="rounded-lg border border-warm-gray/30 px-3 py-1.5 text-sm font-medium hover:border-coral hover:text-coral disabled:opacity-50 transition"
          >
            {queueLoading ? 'Loading...' : 'Refresh'}
          </button>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-coral/30 px-3 py-1.5 text-sm font-medium text-coral hover:bg-coral/10 transition"
          >
            Logout
          </button>
        </div>
      </div>

      {queueError && (
        <div className="mb-4 rounded-xl bg-coral/10 p-3 text-sm text-coral-dark font-medium">
          {queueError}
        </div>
      )}

      {/* All clear state */}
      {queue && queue.generations.length === 0 && queue.suggestions.length === 0 && (
        <div className="flex flex-col items-center text-center py-8 animate-fade-in">
          <LottieMascot state="idle" size="sm" />
          <p className="mt-3 font-display text-lg font-semibold text-charcoal">All caught up!</p>
          <p className="mt-1 text-sm text-warm-gray">No pending items to review right now.</p>
        </div>
      )}

      {/* Generations */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold font-display text-charcoal">
          Pending Generations ({queue?.generations.length ?? 0})
        </h2>
        <div className="space-y-3">
          {queue?.generations.map((gen) => (
            <div
              key={gen.id}
              className="rounded-xl border border-warm-gray/20 bg-white/80 p-4"
            >
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs text-warm-gray">
                    {gen.id.slice(0, 8)}...
                  </span>
                  <span className="ml-2 text-xs text-warm-gray/60">
                    device: {gen.deviceId.slice(0, 8)}...
                  </span>
                </div>
                <span className="text-xs text-warm-gray">
                  {new Date(gen.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="mb-3 text-sm text-charcoal">
                {resolveTokenLabels(gen.tokenIds)}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(gen.id)}
                  disabled={actionLoading === gen.id}
                  className="rounded-lg bg-teal px-4 py-1.5 text-sm font-semibold text-white hover:bg-teal-dark disabled:opacity-50 transition btn-bounce"
                >
                  {actionLoading === gen.id ? 'Generating...' : 'Approve'}
                </button>
                <button
                  onClick={() => handleReject(gen.id)}
                  disabled={actionLoading === gen.id}
                  className="rounded-lg bg-coral px-4 py-1.5 text-sm font-semibold text-white hover:bg-coral-dark disabled:opacity-50 transition btn-bounce"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Suggestions */}
      <section>
        <h2 className="mb-3 text-lg font-semibold font-display text-charcoal">
          Pending Suggestions ({queue?.suggestions.length ?? 0})
        </h2>
        {queue?.suggestions.length === 0 && (
          <p className="text-sm text-warm-gray">No pending suggestions.</p>
        )}
        <div className="space-y-3">
          {queue?.suggestions.map((sug) => (
            <div
              key={sug.id}
              className="rounded-xl border border-warm-gray/20 bg-white/80 p-4"
            >
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <span className="font-medium text-charcoal">&ldquo;{sug.phrase}&rdquo;</span>
                  {sug.category && (
                    <span className="ml-2 text-xs text-warm-gray">
                      ({sug.category})
                    </span>
                  )}
                </div>
                <span className="text-xs text-warm-gray">
                  {new Date(sug.createdAt).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => handleReject(sug.id, 'suggestion')}
                disabled={actionLoading === sug.id}
                className="rounded-lg bg-coral px-4 py-1.5 text-sm font-semibold text-white hover:bg-coral-dark disabled:opacity-50 transition btn-bounce"
              >
                Reject
              </button>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-8 text-center">
        <Link href="/kid" className="text-warm-gray hover:text-charcoal text-sm transition">
          Back to builder
        </Link>
      </div>
    </div>
  )
}
