import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { buildPrompt } from '@/lib/prompt-builder'
import { moderateText } from '@/lib/moderation'
import { checkRateLimit } from '@/lib/rate-limit'

const MAX_ARRAY_LENGTH = {
  effects: 3,
  addons: 3,
  steps: 6,
  ingredients: 6,
} as const

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { deviceId, palette, style, theme, mood, title, creature, effects, addons, steps, ingredients } = body

    // Validate deviceId
    if (!deviceId || typeof deviceId !== 'string' || !UUID_REGEX.test(deviceId)) {
      return NextResponse.json({ error: 'Invalid device ID' }, { status: 400 })
    }

    // Validate required fields
    if (!palette || !style || !theme || !mood) {
      return NextResponse.json(
        { error: 'palette, style, theme, and mood are required' },
        { status: 400 }
      )
    }

    // Validate array lengths
    for (const [field, max] of Object.entries(MAX_ARRAY_LENGTH)) {
      const arr = body[field]
      if (arr && Array.isArray(arr) && arr.length > max) {
        return NextResponse.json(
          { error: `${field} cannot exceed ${max} items` },
          { status: 400 }
        )
      }
    }

    // Rate limit check
    const rateCheck = await checkRateLimit(deviceId)
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: rateCheck.reason },
        { status: 429 }
      )
    }

    // Build prompt (resolves labels → prompt_text from DB, appends safety suffix)
    const { composedPrompt, tokenIds } = await buildPrompt({
      palette,
      style,
      theme,
      mood,
      title,
      creature,
      effects,
      addons,
      steps,
      ingredients,
    })

    // Pre-generation text moderation
    const textModResult = await moderateText(composedPrompt)
    if (textModResult.flagged) {
      return NextResponse.json(
        { error: "Let's try a different combo!" },
        { status: 422 }
      )
    }

    // Store as pending (image generation happens at parent approval)
    const record = await prisma.generationRequest.create({
      data: {
        deviceId,
        tokenIds,
        composedPrompt,
        status: 'pending',
        moderationInput: textModResult.raw as object,
      },
      select: { id: true, status: true, createdAt: true },
    })

    return NextResponse.json({
      id: record.id,
      status: record.status,
      createdAt: record.createdAt,
    })
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Unknown ')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('POST /api/generate error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
