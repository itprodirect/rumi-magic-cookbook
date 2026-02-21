import 'server-only'
import { prisma } from './db'
import { MAX_DAILY_PER_DEVICE, MAX_DAILY_GLOBAL } from './constants'

function startOfDay(): Date {
  const now = new Date()
  now.setUTCHours(0, 0, 0, 0)
  return now
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

export async function getRemainingQuota(deviceId: string): Promise<number> {
  const since = startOfDay()
  const count = await prisma.generationRequest.count({
    where: { deviceId, createdAt: { gte: since } },
  })
  return Math.max(0, MAX_DAILY_PER_DEVICE - count)
}
