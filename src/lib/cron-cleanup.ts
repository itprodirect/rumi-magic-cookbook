import {
  type CleanupCronDeps,
  type CleanupDeletedCounts,
  handleCleanupCronRequest,
} from './cron-cleanup-handler'
import { PENDING_RETENTION_DAYS, APPROVED_RETENTION_DAYS } from './constants'

export async function cleanupExpiredRecords(
  now: Date
): Promise<CleanupDeletedCounts> {
  const { prisma } = await import('./db')

  const pendingCutoff = new Date(now)
  pendingCutoff.setDate(pendingCutoff.getDate() - PENDING_RETENTION_DAYS)

  const approvedCutoff = new Date(now)
  approvedCutoff.setDate(approvedCutoff.getDate() - APPROVED_RETENTION_DAYS)

  const rejectedCutoff = new Date(now)
  rejectedCutoff.setDate(rejectedCutoff.getDate() - 30) // 30 days for rejected

  const deletedPending = await prisma.generationRequest.deleteMany({
    where: { status: 'pending', createdAt: { lt: pendingCutoff } },
  })

  const deletedApproved = await prisma.generationRequest.deleteMany({
    where: {
      status: 'approved',
      OR: [
        { reviewedAt: { lt: approvedCutoff } },
        { reviewedAt: null, createdAt: { lt: approvedCutoff } },
      ],
    },
  })

  const deletedRejected = await prisma.generationRequest.deleteMany({
    where: {
      status: 'rejected',
      OR: [
        { reviewedAt: { lt: rejectedCutoff } },
        { reviewedAt: null, createdAt: { lt: rejectedCutoff } },
      ],
    },
  })

  const deletedSuggestions = await prisma.suggestion.deleteMany({
    where: { status: 'pending', createdAt: { lt: pendingCutoff } },
  })

  return {
    pending: deletedPending.count,
    approved: deletedApproved.count,
    rejected: deletedRejected.count,
    suggestions: deletedSuggestions.count,
  }
}

const defaultDeps: CleanupCronDeps = {
  now: () => new Date(),
  cleanupExpiredRecords,
}

export async function handleCleanupCron(
  request: Request,
  deps: CleanupCronDeps = defaultDeps
): Promise<Response> {
  return handleCleanupCronRequest(request, deps)
}
