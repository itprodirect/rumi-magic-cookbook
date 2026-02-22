'use client'

import Link from 'next/link'
import { LottieMascot } from '@/components/mascot/LottieMascot'
import { SpeechBubble } from '@/components/mascot/SpeechBubble'

export default function EmptyGallery() {
  return (
    <div className="flex flex-col items-center text-center px-4 py-12 animate-fade-in">
      <LottieMascot state="sleeping" size="lg" />

      <div className="mt-4 mb-6">
        <SpeechBubble
          message="Your gallery is empty! Let's fill it with amazing art!"
          variant="tip"
        />
      </div>

      <Link
        href="/kid"
        className="inline-flex items-center justify-center min-h-[52px] px-8 rounded-2xl bg-coral text-white font-display font-semibold text-lg transition hover:bg-coral-dark hover:shadow-hover btn-bounce focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2"
      >
        🎨 Create Your First Masterpiece!
      </Link>
    </div>
  )
}

export { EmptyGallery }
