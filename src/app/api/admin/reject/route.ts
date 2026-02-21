import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const authenticated = await verifySession()
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, type } = await request.json()
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    // Support rejecting both generations and suggestions
    if (type === 'suggestion') {
      const record = await prisma.suggestion.findUnique({
        where: { id },
        select: { id: true, status: true },
      })

      if (!record) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
      if (record.status !== 'pending') {
        return NextResponse.json(
          { error: 'Suggestion is not pending' },
          { status: 409 }
        )
      }

      await prisma.suggestion.update({
        where: { id },
        data: { status: 'rejected', reviewedAt: new Date() },
      })

      return NextResponse.json({ id, status: 'rejected', type: 'suggestion' })
    }

    // Default: generation request
    const record = await prisma.generationRequest.findUnique({
      where: { id },
      select: { id: true, status: true },
    })

    if (!record) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (record.status !== 'pending') {
      return NextResponse.json(
        { error: 'Request is not pending' },
        { status: 409 }
      )
    }

    // Clear image data immediately on rejection
    await prisma.generationRequest.update({
      where: { id },
      data: {
        status: 'rejected',
        imageData: null,
        reviewedAt: new Date(),
      },
    })

    return NextResponse.json({ id, status: 'rejected' })
  } catch (error) {
    console.error('POST /api/admin/reject error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
