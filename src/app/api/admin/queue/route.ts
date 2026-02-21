import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/session'

export async function GET() {
  try {
    const authenticated = await verifySession()
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [generations, suggestions] = await Promise.all([
      prisma.generationRequest.findMany({
        where: { status: 'pending' },
        select: {
          id: true,
          deviceId: true,
          tokenIds: true,
          status: true,
          createdAt: true,
          // composedPrompt excluded — parent sees token labels only
          // imageData excluded — no image yet for pending items
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.suggestion.findMany({
        where: { status: 'pending' },
        select: {
          id: true,
          deviceId: true,
          phrase: true,
          category: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
    ])

    return NextResponse.json({ generations, suggestions })
  } catch (error) {
    console.error('GET /api/admin/queue error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
