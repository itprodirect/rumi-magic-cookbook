'use client'

import Link from 'next/link'
import { GalleryCard, type GalleryImage } from './GalleryCard'

export interface GalleryGridProps {
  images: GalleryImage[]
  onCardClick: (index: number) => void
}

export default function GalleryGrid({ images, onCardClick }: GalleryGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
      {images.map((image, i) => (
        <GalleryCard
          key={image.id}
          image={image}
          index={i}
          onClick={() => onCardClick(i)}
        />
      ))}

      {/* "Create New" card — always last */}
      <Link
        href="/kid"
        className="group flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-teal/40 bg-white/40 min-h-[180px] transition-all duration-200 hover:border-teal hover:bg-teal/10 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2"
        style={{
          animation: `card-entrance 0.4s cubic-bezier(0.22, 1, 0.36, 1) both`,
          animationDelay: `${images.length * 80}ms`,
          opacity: 0,
        }}
      >
        <span className="text-3xl text-teal group-hover:scale-110 transition-transform" aria-hidden="true">
          +
        </span>
        <span className="text-sm font-semibold text-teal-dark">
          Create New Art 🎨
        </span>
      </Link>
    </div>
  )
}

export { GalleryGrid }
