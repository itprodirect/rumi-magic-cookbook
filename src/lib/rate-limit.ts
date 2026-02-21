import 'server-only'
import { Prisma } from '@prisma/client'
import { prisma } from './db'
import { MAX_DAILY_PER_DEVICE, MAX_DAILY_GLOBAL } from './constants'

function startOfDay(): Date {
  const now = new Date()
  now.setUTCHours(0, 0, 0, 0)
  return now
}

const MAX_SERIALIZABLE_RETRIES = 3

function isSerializationConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2034'
  )
}

export async function checkRateLimit(
  deviceId: string
): Promise<{ allowed: boolean; reason?: string }> {
  const since = startOfDay()

  const [deviceCount, globalCount] = await Promise.all([
    prisma.generationRequest.count({
      where: { deviceId, createdAt: { gte: since } },
    }),
    prisma.generationRequest.count({
      where: { createdAt: { gte: since } },
    }),
  ])

  if (deviceCount >= MAX_DAILY_PER_DEVICE) {
    return { allowed: false, reason: 'Daily device limit reached' }
  }

  if (globalCount >= MAX_DAILY_GLOBAL) {
    return { allowed: false, reason: 'Daily global limit reached' }
  }

  return { allowed: true }
}

interface PendingGenerationInput {
  deviceId: string
  tokenIds: Record<string, string | string[]>
  composedPrompt: string
  moderationInput: object
}

type CreatePendingGenerationResult =
  | { allowed: false; reason: string }
  | {
      allowed: true
      record: {
        id: string
        status: string
        createdAt: Date
      }
    }

export async function createPendingGeneration(
  input: PendingGenerationInput
): Promise<CreatePendingGenerationResult> {
  const since = startOfDay()

  for (let attempt = 1; attempt <= MAX_SERIALIZABLE_RETRIES; attempt++) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const [deviceCount, globalCount] = await Promise.all([
            tx.generationRequest.count({
              where: { deviceId: input.deviceId, createdAt: { gte: since } },
            }),
            tx.generationRequest.count({
              where: { createdAt: { gte: since } },
            }),
          ])

          if (deviceCount >= MAX_DAILY_PER_DEVICE) {
            return { allowed: false, reason: 'Daily device limit reached' }
          }

          if (globalCount >= MAX_DAILY_GLOBAL) {
            return { allowed: false, reason: 'Daily global limit reached' }
          }

          const record = await tx.generationRequest.create({
            data: {
              deviceId: input.deviceId,
              tokenIds: input.tokenIds,
              composedPrompt: input.composedPrompt,
              status: 'pending',
              moderationInput: input.moderationInput,
            },
            select: { id: true, status: true, createdAt: true },
          })

          return { allowed: true, record }
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        }
      )
    } catch (error) {
      if (isSerializationConflict(error) && attempt < MAX_SERIALIZABLE_RETRIES) {
        continue
      }
      throw error
    }
  }

  throw new Error('Unable to reserve generation slot')
}

export async function getRemainingQuota(deviceId: string): Promise<number> {
  const since = startOfDay()
  const count = await prisma.generationRequest.count({
    where: { deviceId, createdAt: { gte: since } },
  })
  return Math.max(0, MAX_DAILY_PER_DEVICE - count)
}
