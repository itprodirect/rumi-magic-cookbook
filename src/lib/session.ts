import 'server-only'
import { cookies } from 'next/headers'
import crypto from 'node:crypto'
import { SESSION_TTL_SECONDS } from './constants'

const COOKIE_NAME = 'admin_session'
const ALGORITHM = 'sha256'

function getSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters')
  }
  return secret
}

interface SessionPayload {
  role: 'admin'
  iat: number
  exp: number
}

function sign(payload: SessionPayload): string {
  const data = JSON.stringify(payload)
  const encoded = Buffer.from(data).toString('base64url')
  const hmac = crypto
    .createHmac(ALGORITHM, getSecret())
    .update(encoded)
    .digest('base64url')
  return `${encoded}.${hmac}`
}

function verify(token: string): SessionPayload | null {
  const parts = token.split('.')
  if (parts.length !== 2) return null

  const [encoded, hmac] = parts
  const expectedHmac = crypto
    .createHmac(ALGORITHM, getSecret())
    .update(encoded)
    .digest('base64url')

  if (!crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expectedHmac))) {
    return null
  }

  const payload: SessionPayload = JSON.parse(
    Buffer.from(encoded, 'base64url').toString()
  )

  if (payload.exp < Date.now() / 1000) {
    return null
  }

  return payload
}

export async function createSession(): Promise<void> {
  const now = Math.floor(Date.now() / 1000)
  const payload: SessionPayload = {
    role: 'admin',
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
  }

  const token = sign(payload)
  const cookieStore = await cookies()

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  })
}

export async function verifySession(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return false

  const payload = verify(token)
  if (!payload) return false

  // Sliding expiry: refresh cookie on each authenticated request
  const now = Math.floor(Date.now() / 1000)
  const refreshed: SessionPayload = {
    role: 'admin',
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
  }

  cookieStore.set(COOKIE_NAME, sign(refreshed), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  })

  return true
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}
