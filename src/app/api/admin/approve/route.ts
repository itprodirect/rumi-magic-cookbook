import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/session'
import { openai } from '@/lib/openai'
import { moderateImage } from '@/lib/moderation'

const MAX_IMAGE_BASE64_LENGTH = 8 * 1024 * 1024 // ~8MB base64 payload cap
const UUIDISH_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ALLOWED_IMAGE_MODELS = ['gpt-image-1.5', 'gpt-image-1', 'gpt-image-1-mini'] as const
const ALLOWED_IMAGE_QUALITIES = ['low', 'medium'] as const
const ALLOWED_IMAGE_SIZES = ['1024x1024'] as const
const DEFAULT_IMAGE_MODEL = 'gpt-image-1.5'
const DEFAULT_IMAGE_QUALITY = 'medium'
const DEFAULT_IMAGE_SIZE = '1024x1024'

function isUuidish(value: string): boolean {
  return UUIDISH_REGEX.test(value)
}

function readAllowedEnvValue<T extends readonly string[]>(
  name: string,
  allowedValues: T,
  fallback: T[number]
): T[number] {
  const raw = process.env[name]
  if (!raw) {
    return fallback
  }

  const value = raw.trim()
  if ((allowedValues as readonly string[]).includes(value)) {
    return value as T[number]
  }

  console.warn(
    `Invalid ${name} value "${raw}". Falling back to safe default "${fallback}".`
  )
  return fallback
}

export async function POST(request: NextRequest) {
  try {
    const authenticated = await verifySession()
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await request.json()
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }
    if (!isUuidish(id)) {
      return NextResponse.json(
        { error: 'id must be a UUID-like string' },
        { status: 400 }
      )
    }

    const record = await prisma.generationRequest.findUnique({
      where: { id },
      select: { id: true, status: true, composedPrompt: true },
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

    const imageModel = readAllowedEnvValue(
      'IMAGE_MODEL',
      ALLOWED_IMAGE_MODELS,
      DEFAULT_IMAGE_MODEL
    )
    const imageQuality = readAllowedEnvValue(
      'IMAGE_QUALITY',
      ALLOWED_IMAGE_QUALITIES,
      DEFAULT_IMAGE_QUALITY
    )
    const imageSize = readAllowedEnvValue(
      'IMAGE_SIZE',
      ALLOWED_IMAGE_SIZES,
      DEFAULT_IMAGE_SIZE
    )

    // Generate image via OpenAI (env-configurable model settings)
    const imageResponse = await openai.images.generate({
      model: imageModel,
      prompt: record.composedPrompt,
      quality: imageQuality,
      size: imageSize,
      n: 1,
    })

    const base64Image = imageResponse.data?.[0]?.b64_json
    if (!base64Image) {
      console.error('OpenAI returned no image data for request:', id)
      return NextResponse.json(
        { error: 'Image generation failed' },
        { status: 502 }
      )
    }

    if (base64Image.length > MAX_IMAGE_BASE64_LENGTH) {
      console.error('OpenAI image payload exceeds cap for request:', id)

      await prisma.generationRequest.update({
        where: { id },
        data: {
          status: 'rejected',
          imageData: null,
          reviewedAt: new Date(),
        },
      })

      return NextResponse.json({
        id,
        status: 'rejected',
        reason: 'Image payload too large',
      })
    }

    // Post-generation image moderation
    const imageModResult = await moderateImage(base64Image)
    if (imageModResult.flagged) {
      // Auto-reject: image failed moderation
      await prisma.generationRequest.update({
        where: { id },
        data: {
          status: 'rejected',
          imageData: null,
          moderationOutput: imageModResult.raw as object,
          reviewedAt: new Date(),
        },
      })

      return NextResponse.json({
        id,
        status: 'rejected',
        reason: 'Image failed safety check',
      })
    }

    // Approve: store image
    await prisma.generationRequest.update({
      where: { id },
      data: {
        status: 'approved',
        imageData: base64Image,
        moderationOutput: imageModResult.raw as object,
        reviewedAt: new Date(),
      },
    })

    return NextResponse.json({ id, status: 'approved' })
  } catch (error) {
    console.error('POST /api/admin/approve error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
