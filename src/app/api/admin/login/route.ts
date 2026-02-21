import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createSession } from '@/lib/session'
import { PIN_MAX_ATTEMPTS, PIN_LOCKOUT_MINUTES } from '@/lib/constants'
import { getAdminPinHash } from '@/lib/admin-env'

// In-memory brute-force tracker (resets on server restart — acceptable for V0)
const attempts = new Map<string, { count: number; lastAttempt: number }>()

function isLockedOut(ip: string): boolean {
  const record = attempts.get(ip)
  if (!record) return false

  const lockoutMs = PIN_LOCKOUT_MINUTES * 60 * 1000
  if (Date.now() - record.lastAttempt > lockoutMs) {
    attempts.delete(ip)
    return false
  }

  return record.count >= PIN_MAX_ATTEMPTS
}

function recordFailedAttempt(ip: string): void {
  const record = attempts.get(ip)
  if (record) {
    record.count++
    record.lastAttempt = Date.now()
  } else {
    attempts.set(ip, { count: 1, lastAttempt: Date.now() })
  }
}

function clearAttempts(ip: string): void {
  attempts.delete(ip)
}

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

    if (isLockedOut(ip)) {
      return NextResponse.json(
        { error: 'Too many attempts. Try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { pin } = body

    if (!pin || typeof pin !== 'string') {
      return NextResponse.json({ error: 'PIN is required' }, { status: 400 })
    }

    let hash: string
    try {
      hash = getAdminPinHash()
    } catch (envError) {
      const message =
        envError instanceof Error
          ? envError.message
          : 'Server configuration error'
      console.error('ADMIN_PIN_HASH not configured:', message)
      return NextResponse.json({ error: message }, { status: 500 })
    }

    const valid = await bcrypt.compare(pin, hash)
    if (!valid) {
      recordFailedAttempt(ip)
      return NextResponse.json(
        { error: 'Incorrect PIN' },
        { status: 401 }
      )
    }

    clearAttempts(ip)
    await createSession()

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('POST /api/admin/login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
