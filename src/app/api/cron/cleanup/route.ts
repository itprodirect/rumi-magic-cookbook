import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { prisma } from '@/lib/db'
import { PENDING_RETENTION_DAYS, APPROVED_RETENTION_DAYS } from '@/lib/constants'

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

export async function POST(request: NextRequest) {
  try {
    const configuredSecret = process.env.CRON_SECRET
    if (!configuredSecret) {
      console.error('CRON_SECRET not configured')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const providedSecret = parseBearerToken(request.headers.get('authorization'))
    if (!providedSecret || !safeEquals(providedSecret, configuredSecret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    const pendingCutoff = new Date(now)
    pendingCutoff.setDate(pendingCutoff.getDate() - PENDING_RETENTION_DAYS)

    const approvedCutoff = new Date(now)
    approvedCutoff.setDate(approvedCutoff.getDate() - APPROVED_RETENTION_DAYS)

    const rejectedCutoff = new Date(now)
    rejectedCutoff.setDate(rejectedCutoff.getDate() - 30) // 30 days for rejected

    // Delete expired pending requests
    const deletedPending = await prisma.generationRequest.deleteMany({
      where: { status: 'pending', createdAt: { lt: pendingCutoff } },
    })

    // Delete expired approved requests
    const deletedApproved = await prisma.generationRequest.deleteMany({
      where: {
        status: 'approved',
        OR: [
          { reviewedAt: { lt: approvedCutoff } },
          { reviewedAt: null, createdAt: { lt: approvedCutoff } },
        ],
      },
    })

    // Delete expired rejected requests
    const deletedRejected = await prisma.generationRequest.deleteMany({
      where: {
        status: 'rejected',
        OR: [
          { reviewedAt: { lt: rejectedCutoff } },
          { reviewedAt: null, createdAt: { lt: rejectedCutoff } },
        ],
      },
    })

    // Delete expired pending suggestions
    const deletedSuggestions = await prisma.suggestion.deleteMany({
      where: { status: 'pending', createdAt: { lt: pendingCutoff } },
    })

    return NextResponse.json({
      deleted: {
        pending: deletedPending.count,
        approved: deletedApproved.count,
        rejected: deletedRejected.count,
        suggestions: deletedSuggestions.count,
      },
    })
  } catch (error) {
    console.error('POST /api/cron/cleanup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
