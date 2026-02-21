const STORAGE_KEY = 'rumi_device_id'

export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') {
    throw new Error('getOrCreateDeviceId must be called in the browser')
  }

  const existing = localStorage.getItem(STORAGE_KEY)
  if (existing) return existing

  const id = crypto.randomUUID()
  localStorage.setItem(STORAGE_KEY, id)
  return id
}
