import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const presets = await prisma.preset.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        tokenIds: true,
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ presets })
  } catch (error) {
    console.error('GET /api/presets error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
