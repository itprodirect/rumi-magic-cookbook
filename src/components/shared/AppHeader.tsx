import Link from 'next/link'

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-40 bg-cream/90 backdrop-blur-sm border-b border-paper">
      <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
        <Link
          href="/kid"
          className="font-display text-xl font-bold text-coral hover:text-coral-dark transition-colors"
        >
          Rumi&apos;s Magic Cookbook
        </Link>

        <nav className="hidden md:flex items-center gap-5 text-sm font-semibold" aria-label="Main">
          <Link
            href="/kid"
            className="text-charcoal hover:text-coral transition-colors"
          >
            Build
          </Link>
          <Link
            href="/gallery"
            className="text-charcoal hover:text-coral transition-colors"
          >
            Gallery
          </Link>
          <Link
            href="/parent"
            className="text-warm-gray hover:text-charcoal transition-colors text-xs"
          >
            Parent
          </Link>
        </nav>
      </div>
    </header>
  )
}
