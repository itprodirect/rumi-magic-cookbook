import { NextResponse } from 'next/server'
import { destroySession, verifySession } from '@/lib/session'

export async function POST() {
  try {
    const authenticated = await verifySession()
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await destroySession()
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('POST /api/admin/logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
