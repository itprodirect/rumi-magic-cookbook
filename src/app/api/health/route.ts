import { NextResponse } from 'next/server'
import { validateServerEnv } from '@/lib/server-env'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const isProduction = process.env.NODE_ENV === 'production'
  const env = validateServerEnv()

  let db = {
    ok: false,
    error: null as string | null,
  }

  if (env.ok) {
    try {
      const { prisma } = await import('@/lib/db')
      await prisma.$queryRaw`SELECT 1`
      db = { ok: true, error: null }
    } catch (error) {
      console.error('GET /api/health db check error:', error)
      db = {
        ok: false,
        error:
          process.env.NODE_ENV === 'production'
            ? 'Database connectivity check failed'
            : error instanceof Error
              ? error.message
              : 'Database connectivity check failed',
      }
    }
  } else {
    db = {
      ok: false,
      error: 'Skipped because env validation failed',
    }
  }

  const ok = env.ok && db.ok

  if (isProduction) {
    return NextResponse.json(
      { status: ok ? 'ok' : 'degraded' },
      { status: ok ? 200 : 503 }
    )
  }

  return NextResponse.json(
    {
      ok,
      timestamp: new Date().toISOString(),
      checks: {
        env,
        db,
      },
    },
    { status: ok ? 200 : 503 }
  )
}
