'use client'

import { useEffect, useCallback, useRef } from 'react'
import { type GalleryImage } from './GalleryCard'

export interface ImageViewerProps {
  images: GalleryImage[]
  selectedIndex: number
  onClose: () => void
  onNavigate: (index: number) => void
  onDownload: () => void
}

function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function ImageViewer({
  images,
  selectedIndex,
  onClose,
  onNavigate,
  onDownload,
}: ImageViewerProps) {
  const image = images[selectedIndex]
  const title = image?.title?.trim() || null
  const hasPrev = selectedIndex > 0
  const hasNext = selectedIndex < images.length - 1
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previouslyFocused = useRef<Element | null>(null)

  // Save previously focused element and auto-focus close button
  useEffect(() => {
    previouslyFocused.current = document.activeElement
    closeButtonRef.current?.focus()
    return () => {
      if (previouslyFocused.current instanceof HTMLElement) {
        previouslyFocused.current.focus()
      }
    }
  }, [])

  // Keyboard navigation
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if ((e.key === 'ArrowRight' || e.key === 'ArrowDown') && hasNext) {
        e.preventDefault()
        onNavigate(selectedIndex + 1)
      } else if ((e.key === 'ArrowLeft' || e.key === 'ArrowUp') && hasPrev) {
        e.preventDefault()
        onNavigate(selectedIndex - 1)
      }
    },
    [onClose, onNavigate, selectedIndex, hasPrev, hasNext]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  // Trap focus by preventing body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  if (!image) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
    >
      <div
        className="relative mx-4 flex max-h-[92vh] w-full max-w-3xl flex-col rounded-2xl bg-cream shadow-hover overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 h-9 w-9 rounded-full bg-white/90 text-charcoal flex items-center justify-center text-lg font-bold shadow-soft hover:bg-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral"
          aria-label="Close image viewer"
        >
          ✕
        </button>

        {/* Image area */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-3 bg-paper/50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:image/png;base64,${image.imageData}`}
            alt={title || 'Recipe card full view'}
            className="max-h-[65vh] max-w-full object-contain rounded-xl"
          />
        </div>

        {/* Footer */}
        <div className="border-t border-warm-gray/15 px-4 py-3 flex items-center justify-between gap-3">
          {/* Metadata */}
          <div className="min-w-0 flex-1">
            {title && (
              <p className="font-display font-semibold text-charcoal text-sm truncate">
                {title}
              </p>
            )}
            <p className="text-xs text-warm-gray">
              {formatFullDate(image.createdAt)} · Image {selectedIndex + 1} of {images.length}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Prev */}
            <button
              type="button"
              onClick={() => onNavigate(selectedIndex - 1)}
              disabled={!hasPrev}
              className="h-9 w-9 rounded-full border border-warm-gray/20 text-charcoal flex items-center justify-center text-sm transition hover:border-coral hover:text-coral disabled:opacity-30 disabled:hover:border-warm-gray/20 disabled:hover:text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral"
              aria-label="Previous image"
            >
              ←
            </button>

            {/* Next */}
            <button
              type="button"
              onClick={() => onNavigate(selectedIndex + 1)}
              disabled={!hasNext}
              className="h-9 w-9 rounded-full border border-warm-gray/20 text-charcoal flex items-center justify-center text-sm transition hover:border-coral hover:text-coral disabled:opacity-30 disabled:hover:border-warm-gray/20 disabled:hover:text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral"
              aria-label="Next image"
            >
              →
            </button>

            {/* Download */}
            <button
              type="button"
              onClick={onDownload}
              className="h-9 px-3 rounded-full bg-coral text-white text-xs font-semibold flex items-center gap-1 transition hover:bg-coral-dark btn-bounce focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2"
            >
              📥 Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export { ImageViewer }
