import 'server-only'
import { openai } from './openai'

interface ModerationResult {
  flagged: boolean
  categories: Record<string, boolean>
  raw: unknown
}

export async function moderateText(text: string): Promise<ModerationResult> {
  const response = await openai.moderations.create({
    model: 'omni-moderation-latest',
    input: text,
  })

  const result = response.results[0]
  return {
    flagged: result.flagged,
    categories: result.categories as unknown as Record<string, boolean>,
    raw: result,
  }
}

export async function moderateImage(
  base64Image: string
): Promise<ModerationResult> {
  const response = await openai.moderations.create({
    model: 'omni-moderation-latest',
    input: [
      {
        type: 'image_url',
        image_url: {
          url: `data:image/png;base64,${base64Image}`,
        },
      },
    ],
  })

  const result = response.results[0]
  return {
    flagged: result.flagged,
    categories: result.categories as unknown as Record<string, boolean>,
    raw: result,
  }
}
