import test from 'node:test'
import assert from 'node:assert/strict'

const { handleCleanupCronRequest } = await import(
  new URL('../src/lib/cron-cleanup-handler.ts', import.meta.url).href
)

test('cron cleanup rejects missing authorization header', async () => {
  const previousSecret = process.env.CRON_SECRET
  process.env.CRON_SECRET = 'test-secret'

  let called = false

  try {
    const response = await handleCleanupCronRequest(
      new Request('http://localhost/api/cron/cleanup', { method: 'GET' }),
      {
        now: () => new Date('2026-02-22T05:00:00.000Z'),
        cleanupExpiredRecords: async () => {
          called = true
          return { pending: 0, approved: 0, rejected: 0, suggestions: 0 }
        },
      }
    )

    assert.equal(response.status, 401)
    assert.equal(called, false)
    assert.deepEqual(await response.json(), { error: 'Unauthorized' })
  } finally {
    if (previousSecret === undefined) {
      delete process.env.CRON_SECRET
    } else {
      process.env.CRON_SECRET = previousSecret
    }
  }
})

test('cron cleanup accepts bearer auth and returns deleted counts', async () => {
  const previousSecret = process.env.CRON_SECRET
  process.env.CRON_SECRET = 'test-secret'

  let callCount = 0
  const expectedDeleted = {
    pending: 1,
    approved: 2,
    rejected: 3,
    suggestions: 4,
  }

  try {
    const response = await handleCleanupCronRequest(
      new Request('http://localhost/api/cron/cleanup', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer test-secret',
        },
      }),
      {
        now: () => new Date('2026-02-22T05:00:00.000Z'),
        cleanupExpiredRecords: async () => {
          callCount += 1
          return expectedDeleted
        },
      }
    )

    assert.equal(response.status, 200)
    assert.equal(callCount, 1)
    assert.deepEqual(await response.json(), { deleted: expectedDeleted })
  } finally {
    if (previousSecret === undefined) {
      delete process.env.CRON_SECRET
    } else {
      process.env.CRON_SECRET = previousSecret
    }
  }
})
