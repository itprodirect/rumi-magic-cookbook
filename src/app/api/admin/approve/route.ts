import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/session'
import { openai } from '@/lib/openai'
import { moderateImage } from '@/lib/moderation'

const MAX_IMAGE_BASE64_LENGTH = 8 * 1024 * 1024 // ~8MB base64 payload cap

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

    // Generate image via OpenAI
    const imageResponse = await openai.images.generate({
      model: 'gpt-image-1',
      prompt: record.composedPrompt,
      quality: 'low',
      size: '1024x1024',
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
