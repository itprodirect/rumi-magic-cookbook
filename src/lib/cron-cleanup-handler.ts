import crypto from 'node:crypto'

export type CleanupDeletedCounts = {
  pending: number
  approved: number
  rejected: number
  suggestions: number
}

export type CleanupCronDeps = {
  now: () => Date
  cleanupExpiredRecords: (now: Date) => Promise<CleanupDeletedCounts>
}

function parseBearerToken(header: string | null): string | null {
  if (!header) return null

  const [scheme, token, ...rest] = header.trim().split(/\s+/)
  if (rest.length > 0) return null
  if (!scheme || scheme.toLowerCase() !== 'bearer') return null
  if (!token) return null

  return token
}

function safeEquals(left: string, right: string): boolean {
  const leftBuf = Buffer.from(left)
  const rightBuf = Buffer.from(right)
  if (leftBuf.length !== rightBuf.length) return false
  return crypto.timingSafeEqual(leftBuf, rightBuf)
}

export async function handleCleanupCronRequest(
  request: Request,
  deps: CleanupCronDeps
): Promise<Response> {
  try {
    const configuredSecret = process.env.CRON_SECRET
    if (!configuredSecret) {
      console.error('CRON_SECRET not configured')
      return Response.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const providedSecret = parseBearerToken(request.headers.get('authorization'))
    if (!providedSecret || !safeEquals(providedSecret, configuredSecret)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const deleted = await deps.cleanupExpiredRecords(deps.now())
    return Response.json({ deleted })
  } catch (error) {
    console.error(`${request.method} /api/cron/cleanup error:`, error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

