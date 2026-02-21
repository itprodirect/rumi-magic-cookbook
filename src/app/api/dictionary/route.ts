import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const items = await prisma.dictionaryItem.findMany({
      where: { isActive: true },
      select: {
        id: true,
        category: true,
        label: true,
        tags: true,
        // promptText deliberately excluded — server-only
      },
      orderBy: [{ category: 'asc' }, { label: 'asc' }],
    })

    return NextResponse.json({ items })
  } catch (error) {
    console.error('GET /api/dictionary error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
