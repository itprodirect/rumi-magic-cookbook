'use client'

import { useEffect, useState, useCallback } from 'react'
import { apiFetch, ApiError } from '@/lib/api-client'
import { getOrCreateDeviceId } from '@/lib/device-id'
import { downloadBase64Image } from '@/lib/download'

import { LottieMascot } from '@/components/mascot/LottieMascot'
import { SpeechBubble } from '@/components/mascot/SpeechBubble'
import { AchievementBanner } from '@/components/gallery/AchievementBanner'
import { GalleryGrid } from '@/components/gallery/GalleryGrid'
import { EmptyGallery } from '@/components/gallery/EmptyGallery'
import { ImageViewer } from '@/components/gallery/ImageViewer'
import { Toast } from '@/components/feedback/Toast'
import { ScrollToTop } from '@/components/shared/ScrollToTop'

// ── Types ──

interface GalleryImage {
  id: string
  title: string | null
  imageData: string
  createdAt: string
}

/** Sanitize a string for use as a filename segment. */
function sanitizeForFilename(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
}

// ── Component ──

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; visible: boolean }>({
    message: '',
    type: 'info',
    visible: false,
  })

  // ── Data loading ──

  async function loadGallery() {
    setLoading(true)
    setError(null)
    try {
      const id = getOrCreateDeviceId()
      const res = await apiFetch<{ images: GalleryImage[] }>(
        `/api/gallery?deviceId=${encodeURIComponent(id)}`
      )
      setImages(res.images)
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message)
      } else {
        setError('Failed to load gallery')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGallery()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Download (preserved from original) ──

  const handleDownload = useCallback(() => {
    if (selectedIndex === null) return
    const image = images[selectedIndex]
    if (!image) return

    const date = new Date(image.createdAt)
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, '')
    const title = image.title?.trim()
    const namePart = title ? sanitizeForFilename(title) : image.id.slice(0, 8)
    downloadBase64Image(
      image.imageData,
      `rumi-${namePart}-${date}.png`
    )
  }, [selectedIndex, images])

  // ── Render: Loading ──

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <LottieMascot state="thinking" size="md" />
        <p className="text-warm-gray font-display text-lg">Loading your gallery...</p>
      </div>
    )
  }

  // ── Render: Gallery ──

  return (
    <>
      <Toast {...toast} onClose={() => setToast((t) => ({ ...t, visible: false }))} />

      {/* Image viewer modal */}
      {selectedIndex !== null && images.length > 0 && (
        <ImageViewer
          images={images}
          selectedIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
          onNavigate={setSelectedIndex}
          onDownload={handleDownload}
        />
      )}

      <div className="mx-auto max-w-4xl px-4 py-6 space-y-5">
        {/* ── Header ── */}
        <h1 className="font-display text-2xl font-bold text-charcoal animate-fade-in">
          🖼️ My Art Gallery
        </h1>

        {/* ── Error ── */}
        {error && (
          <div className="flex flex-col items-center text-center py-8 animate-fade-in">
            <LottieMascot state="sleeping" size="sm" />
            <SpeechBubble message="Couldn't load your gallery right now." />
            <p className="mt-2 text-sm text-warm-gray max-w-xs">{error}</p>
            <button
              type="button"
              onClick={() => loadGallery()}
              className="mt-3 min-h-[44px] rounded-xl bg-coral px-5 text-white font-display font-semibold transition hover:bg-coral-dark btn-bounce"
            >
              Try Again
            </button>
          </div>
        )}

        {/* ── Achievement banner ── */}
        {!error && <AchievementBanner count={images.length} />}

        {/* ── Empty or grid ── */}
        {!error && images.length === 0 ? (
          <EmptyGallery />
        ) : (
          <GalleryGrid
            images={images}
            onCardClick={setSelectedIndex}
          />
        )}
      </div>

      <ScrollToTop />
    </>
  )
}
