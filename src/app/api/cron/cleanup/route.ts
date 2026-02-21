import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { PENDING_RETENTION_DAYS, APPROVED_RETENTION_DAYS } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!secret || secret !== process.env.CRON_SECRET) {
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
      where: { status: 'approved', createdAt: { lt: approvedCutoff } },
    })

    // Delete expired rejected requests
    const deletedRejected = await prisma.generationRequest.deleteMany({
      where: { status: 'rejected', createdAt: { lt: rejectedCutoff } },
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
