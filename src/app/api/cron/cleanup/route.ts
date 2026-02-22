import { handleCleanupCron } from '@/lib/cron-cleanup'

export async function GET(request: Request) {
  return handleCleanupCron(request)
}

export async function POST(request: Request) {
  return handleCleanupCron(request)
}

