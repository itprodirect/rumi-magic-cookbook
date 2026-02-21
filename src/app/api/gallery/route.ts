import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

function extractTitle(tokenIds: unknown): string | null {
  if (!tokenIds || typeof tokenIds !== 'object' || Array.isArray(tokenIds)) {
    return null
  }

  const title = (tokenIds as Record<string, unknown>).title
  if (typeof title !== 'string') {
    return null
  }

  const trimmed = title.trim()
  return trimmed.length > 0 ? trimmed : null
}

export async function GET(request: NextRequest) {
  try {
    const deviceId = request.nextUrl.searchParams.get('deviceId')
    if (!deviceId) {
      return NextResponse.json(
        { error: 'deviceId is required' },
        { status: 400 }
      )
    }

    const rows = await prisma.generationRequest.findMany({
      where: { deviceId, status: 'approved' },
      select: {
        id: true,
        tokenIds: true,
        imageData: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const images = rows.map(({ id, tokenIds, imageData, createdAt }) => ({
      id,
      title: extractTitle(tokenIds),
      imageData,
      createdAt,
    }))

    return NextResponse.json({ images })
  } catch (error) {
    console.error('GET /api/gallery error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
