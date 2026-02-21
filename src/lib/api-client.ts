export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, options)

  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const body = await res.json()
      if (body?.error && typeof body.error === 'string') {
        message = body.error
      }
    } catch {
      // response wasn't JSON, keep default message
    }
    throw new ApiError(res.status, message)
  }

  return res.json() as Promise<T>
}
