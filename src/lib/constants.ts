/**
 * Safety suffix appended to every composed prompt before generation.
 */
export const SAFETY_SUFFIX =
  'kid-safe, G-rated, cartoon illustration only, no text overlays, ' +
  'no realistic humans, no scary imagery, no weapons, no gore, ' +
  'no nudity, cute and friendly, recipe card layout, clear sections'

/**
 * Extra guardrail appended when spooky-cute tokens are detected.
 */
export const SPOOKY_CUTE_EXTRA =
  'NOT scary, NOT horror, soft moonlight, smiling faces, ' +
  'round shapes, pastel accents, cozy and friendly'

function envInt(name: string, fallback: number): number {
  const raw = process.env[name]
  if (!raw) return fallback

  const parsed = Number.parseInt(raw, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`)
  }

  return parsed
}

// --- Rate limits ---
export const MAX_DAILY_PER_DEVICE = envInt('MAX_DAILY_PER_DEVICE', 10)
export const MAX_DAILY_PER_IP = envInt('MAX_DAILY_PER_IP', 20)
export const MAX_DAILY_GLOBAL = envInt('MAX_DAILY_GLOBAL', 100)

// --- Input limits ---
export const SUGGESTION_MAX_LENGTH = 60

// --- Auth ---
export const PIN_MAX_ATTEMPTS = 5
export const PIN_LOCKOUT_MINUTES = 60
export const SESSION_TTL_SECONDS = 1800

// --- Retention ---
export const PENDING_RETENTION_DAYS = 7
export const APPROVED_RETENTION_DAYS = 90
