'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/kid', label: 'Build', icon: '🎨' },
  { href: '/gallery', label: 'Gallery', icon: '🖼️' },
] as const

export default function AppNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-cream/95 backdrop-blur-sm border-t border-paper flex justify-around items-stretch"
      aria-label="Mobile navigation"
    >
      {NAV_ITEMS.map(({ href, label, icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center justify-center gap-0.5 min-h-[56px] flex-1 text-xs font-semibold transition-colors ${
              active
                ? 'text-coral'
                : 'text-warm-gray hover:text-charcoal'
            }`}
            aria-current={active ? 'page' : undefined}
          >
            <span aria-hidden="true" className="text-xl leading-none">
              {icon}
            </span>
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
