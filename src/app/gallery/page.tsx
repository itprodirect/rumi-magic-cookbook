'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { apiFetch, ApiError } from '@/lib/api-client'
import { getOrCreateDeviceId } from '@/lib/device-id'
import { downloadBase64Image } from '@/lib/download'

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
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

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

  // Keyboard navigation
  useEffect(() => {
    if (selectedIndex === null) return

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setSelectedIndex(null)
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) =>
          i !== null && i < images.length - 1 ? i + 1 : i
        )
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => (i !== null && i > 0 ? i - 1 : i))
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [selectedIndex, images.length])

  const selected = selectedIndex !== null ? images[selectedIndex] : null

  const handleDownload = useCallback(() => {
    if (!selected) return
    const date = new Date(selected.createdAt)
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, '')
    downloadBase64Image(
      selected.imageData,
      `rumi-recipe-${date}-${selected.id.slice(0, 8)}.png`
    )
  }, [selected])

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
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setSelectedIndex(i)}
              className="overflow-hidden rounded border border-zinc-200 text-left transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:image/png;base64,${img.imageData}`}
                alt="Recipe card"
                className="w-full"
              />
              <div className="p-2 text-xs text-zinc-500">
                {new Date(img.createdAt).toLocaleDateString()}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Lightbox modal */}
      {selected && selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setSelectedIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
        >
          <div
            className="relative mx-4 flex max-h-[90vh] max-w-3xl flex-col rounded-lg bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setSelectedIndex(null)}
              className="absolute right-2 top-2 z-10 rounded-full bg-white/80 px-2 py-1 text-sm font-medium text-zinc-600 hover:bg-white"
              aria-label="Close"
            >
              ✕
            </button>

            {/* Image */}
            <div className="flex-1 overflow-auto p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:image/png;base64,${selected.imageData}`}
                alt="Recipe card full view"
                className="mx-auto max-h-[70vh] object-contain"
              />
            </div>

            {/* Footer: metadata + actions */}
            <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3">
              <div className="text-sm text-zinc-500">
                {new Date(selected.createdAt).toLocaleDateString()} · Image{' '}
                {selectedIndex + 1} of {images.length}
              </div>

              <div className="flex items-center gap-2">
                {/* Prev/Next */}
                <button
                  type="button"
                  onClick={() => setSelectedIndex(selectedIndex - 1)}
                  disabled={selectedIndex === 0}
                  className="rounded border border-zinc-300 px-2 py-1 text-sm disabled:opacity-30"
                  aria-label="Previous image"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIndex(selectedIndex + 1)}
                  disabled={selectedIndex === images.length - 1}
                  className="rounded border border-zinc-300 px-2 py-1 text-sm disabled:opacity-30"
                  aria-label="Next image"
                >
                  →
                </button>

                {/* Download */}
                <button
                  type="button"
                  onClick={handleDownload}
                  className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                >
                  Download
                </button>
              </div>
            </div>
          </div>
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
