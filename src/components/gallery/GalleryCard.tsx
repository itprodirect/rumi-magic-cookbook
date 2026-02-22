'use client'

export interface GalleryImage {
  id: string
  title: string | null
  imageData: string
  createdAt: string
  status?: string
}

export interface GalleryCardProps {
  image: GalleryImage
  index: number
  onClick: () => void
}

const ROTATIONS = [-2, -1, 0, 1, 2]

function formatShortDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function GalleryCard({ image, index, onClick }: GalleryCardProps) {
  const rotation = ROTATIONS[index % ROTATIONS.length]
  const title = image.title?.trim() || null
  const isPending = image.status === 'pending'

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative text-left rounded-2xl border border-warm-gray/15 bg-white/80 overflow-hidden transition-all duration-200 hover:scale-[1.03] hover:shadow-hover hover:rotate-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2"
      style={{
        '--card-index': index,
        transform: `rotate(${rotation}deg)`,
        animation: `card-entrance 0.4s cubic-bezier(0.22, 1, 0.36, 1) both`,
        animationDelay: `${index * 80}ms`,
        opacity: 0,
      } as React.CSSProperties}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-paper">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`data:image/png;base64,${image.imageData}`}
          alt={title || 'Recipe card art'}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />

        {/* Pending overlay */}
        {isPending && (
          <div className="absolute inset-0 bg-cream/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-1 animate-pulse-soft">
            <span className="text-2xl" aria-hidden="true">⏳</span>
            <span className="text-xs font-semibold text-warm-gray">
              Waiting for approval
            </span>
          </div>
        )}
      </div>

      {/* Caption */}
      <div className="px-3 py-2">
        {title && (
          <p className="text-sm font-semibold text-charcoal truncate">{title}</p>
        )}
        <p className="text-xs text-warm-gray">{formatShortDate(image.createdAt)}</p>
      </div>
    </button>
  )
}

export { GalleryCard }
