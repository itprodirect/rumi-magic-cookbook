'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { apiFetch, ApiError } from '@/lib/api-client'

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

export default function AdminPage() {
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
        <h1 className="mb-6 text-2xl font-bold text-center">Parent Login</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="password"
            placeholder="Enter PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-center text-lg tracking-widest"
            autoFocus
          />
          <button
            type="submit"
            disabled={loginLoading || !pin}
            className="w-full rounded bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loginLoading ? 'Verifying...' : 'Login'}
          </button>
        </form>
        {loginError && (
          <div className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700 text-center">
            {loginError}
          </div>
        )}
        <div className="mt-6 text-center">
          <Link href="/" className="text-zinc-500 hover:underline text-sm">
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
        <h1 className="text-2xl font-bold">Admin Queue</h1>
        <div className="flex gap-2">
          <button
            onClick={fetchQueue}
            disabled={queueLoading}
            className="rounded border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-50 disabled:opacity-50"
          >
            {queueLoading ? 'Loading...' : 'Refresh'}
          </button>
          <button
            onClick={handleLogout}
            className="rounded border border-red-300 px-3 py-1 text-sm text-red-600 hover:bg-red-50"
          >
            Logout
          </button>
        </div>
      </div>

      {queueError && (
        <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">
          {queueError}
        </div>
      )}

      {/* Generations */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">
          Pending Generations ({queue?.generations.length ?? 0})
        </h2>
        {queue?.generations.length === 0 && (
          <p className="text-sm text-zinc-500">No pending generations.</p>
        )}
        <div className="space-y-3">
          {queue?.generations.map((gen) => (
            <div
              key={gen.id}
              className="rounded border border-zinc-200 p-3"
            >
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs text-zinc-500">
                    {gen.id.slice(0, 8)}...
                  </span>
                  <span className="ml-2 text-xs text-zinc-400">
                    device: {gen.deviceId.slice(0, 8)}...
                  </span>
                </div>
                <span className="text-xs text-zinc-400">
                  {new Date(gen.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="mb-2 text-sm text-zinc-700">
                {resolveTokenLabels(gen.tokenIds)}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(gen.id)}
                  disabled={actionLoading === gen.id}
                  className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {actionLoading === gen.id ? 'Generating...' : 'Approve'}
                </button>
                <button
                  onClick={() => handleReject(gen.id)}
                  disabled={actionLoading === gen.id}
                  className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700 disabled:opacity-50"
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
        <h2 className="mb-3 text-lg font-semibold">
          Pending Suggestions ({queue?.suggestions.length ?? 0})
        </h2>
        {queue?.suggestions.length === 0 && (
          <p className="text-sm text-zinc-500">No pending suggestions.</p>
        )}
        <div className="space-y-3">
          {queue?.suggestions.map((sug) => (
            <div
              key={sug.id}
              className="rounded border border-zinc-200 p-3"
            >
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <span className="font-medium">&ldquo;{sug.phrase}&rdquo;</span>
                  {sug.category && (
                    <span className="ml-2 text-xs text-zinc-400">
                      ({sug.category})
                    </span>
                  )}
                </div>
                <span className="text-xs text-zinc-400">
                  {new Date(sug.createdAt).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => handleReject(sug.id, 'suggestion')}
                disabled={actionLoading === sug.id}
                className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-8 text-center">
        <Link href="/" className="text-zinc-500 hover:underline text-sm">
          Back to builder
        </Link>
      </div>
    </div>
  )
}
