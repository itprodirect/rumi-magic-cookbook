import { NextRequest, NextResponse } from 'next/server'
import { buildPrompt } from '@/lib/prompt-builder'
import { moderateText } from '@/lib/moderation'
import { checkRateLimit, createPendingGeneration } from '@/lib/rate-limit'

const MAX_ARRAY_LENGTH = {
  effects: 3,
  addons: 3,
  steps: 6,
  ingredients: 6,
} as const

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { deviceId, palette, style, theme, mood, title, creature, effects, addons, steps, ingredients } = body

    // Validate deviceId
    if (!deviceId || typeof deviceId !== 'string' || !UUID_REGEX.test(deviceId)) {
      return NextResponse.json({ error: 'Invalid device ID' }, { status: 400 })
    }

    // Validate required single-value fields
    if (
      !isNonEmptyString(palette) ||
      !isNonEmptyString(style) ||
      !isNonEmptyString(theme) ||
      !isNonEmptyString(mood)
    ) {
      return NextResponse.json(
        { error: 'palette, style, theme, and mood are required' },
        { status: 400 }
      )
    }

    // Validate optional single-value fields
    for (const [field, value] of [
      ['title', title],
      ['creature', creature],
    ] as const) {
      if (value !== undefined && !isNonEmptyString(value)) {
        return NextResponse.json(
          { error: `${field} must be a non-empty string` },
          { status: 400 }
        )
      }
    }

    // Validate array fields (type + length)
    for (const [field, max] of Object.entries(MAX_ARRAY_LENGTH) as [
      keyof typeof MAX_ARRAY_LENGTH,
      number
    ][]) {
      const arr = body[field]
      if (arr === undefined) continue

      if (!Array.isArray(arr) || arr.some((v) => typeof v !== 'string')) {
        return NextResponse.json(
          { error: `${field} must be an array of strings` },
          { status: 400 }
        )
      }

      if (arr.length > max) {
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

    // Store as pending (image generation happens at parent approval).
    // This create uses a serializable transaction to prevent parallel quota bypass.
    const createResult = await createPendingGeneration({
      deviceId,
      tokenIds,
      composedPrompt,
      moderationInput: textModResult.raw as object,
    })

    if (!createResult.allowed) {
      return NextResponse.json(
        { error: createResult.reason },
        { status: 429 }
      )
    }

    const { record } = createResult

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
