'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiFetch, ApiError } from '@/lib/api-client'
import { getOrCreateDeviceId } from '@/lib/device-id'

interface GalleryImage {
  id: string
  tokenIds: Record<string, string | string[]>
  imageData: string
  createdAt: string
}

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deviceId, setDeviceId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const id = getOrCreateDeviceId()
        setDeviceId(id)

        const res = await apiFetch<{ images: GalleryImage[] }>(
          `/api/gallery?deviceId=${encodeURIComponent(id)}`
        )
        setImages(res.images)
      } catch (e) {
        if (e instanceof ApiError) {
          setError(`${e.message} (status ${e.status})`)
        } else {
          setError('Failed to load gallery')
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-zinc-500">Loading gallery...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">Your Recipe Cards</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Device: {deviceId ? deviceId.slice(0, 8) + '...' : 'unknown'}
      </p>

      {error && (
        <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">
          {error}
          {deviceId && (
            <span className="block mt-1 text-xs text-red-500">
              Device ID: {deviceId}
            </span>
          )}
        </div>
      )}

      {!error && images.length === 0 && (
        <div className="rounded bg-zinc-50 p-8 text-center text-zinc-500">
          <p className="text-lg">No approved images yet.</p>
          <p className="mt-2 text-sm">
            Create a recipe and ask your parent to approve it!
          </p>
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((img) => (
            <div
              key={img.id}
              className="overflow-hidden rounded border border-zinc-200"
            >
              <img
                src={`data:image/png;base64,${img.imageData}`}
                alt="Recipe card"
                className="w-full"
              />
              <div className="p-2 text-xs text-zinc-500">
                {new Date(img.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 text-center">
        <Link href="/" className="text-blue-600 hover:underline">
          Create another recipe
        </Link>
      </div>
    </div>
  )
}
