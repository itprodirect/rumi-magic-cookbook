import type { Metadata } from 'next'
import { Baloo_2, Nunito } from 'next/font/google'
import { assertServerEnvAtStartup } from '@/lib/server-env'
import AppHeader from '@/components/shared/AppHeader'
import AppNav from '@/components/shared/AppNav'
import BackgroundDecor from '@/components/shared/BackgroundDecor'
import './globals.css'

assertServerEnvAtStartup()

const baloo = Baloo_2({
  variable: '--font-baloo',
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  display: 'swap',
})

const nunito = Nunito({
  variable: '--font-nunito',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: "Rumi's Magic Cookbook",
  description: 'Build your own magical recipe card!',
  manifest: '/manifest.json',
  themeColor: '#FF6B8A',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: "Rumi's Magic Cookbook",
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${baloo.variable} ${nunito.variable}`}>
      <body className="font-body bg-cream text-charcoal antialiased min-h-screen flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-coral focus:px-4 focus:py-2 focus:text-white focus:font-semibold focus:shadow-hover"
        >
          Skip to content
        </a>
        <BackgroundDecor />
        <AppHeader />
        <main id="main-content" className="flex-1 pb-20 md:pb-0">
          {children}
        </main>
        <AppNav />
      </body>
    </html>
  )
}
