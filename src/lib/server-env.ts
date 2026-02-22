import 'server-only'
import { getAdminPinHash } from './admin-env'

const ALLOWED_IMAGE_MODELS = ['gpt-image-1.5', 'gpt-image-1', 'gpt-image-1-mini'] as const
const ALLOWED_IMAGE_QUALITIES = ['low', 'medium'] as const
const ALLOWED_IMAGE_SIZES = ['1024x1024'] as const

type EnvIssue = {
  name: string
  message: string
  required: boolean
}

export type ServerEnvValidationResult = {
  ok: boolean
  issues: EnvIssue[]
  warnings: string[]
}

function readRequiredString(name: string, issues: EnvIssue[]): string | null {
  const raw = process.env[name]
  if (typeof raw !== 'string' || raw.trim().length === 0) {
    issues.push({
      name,
      message: `${name} is required and must be non-empty`,
      required: true,
    })
    return null
  }
  return raw.trim()
}

function validateOptionalAllowedValue<T extends readonly string[]>(
  name: string,
  allowed: T,
  warnings: string[]
): void {
  const raw = process.env[name]
  if (!raw) return

  const value = raw.trim()
  if (!(allowed as readonly string[]).includes(value)) {
    warnings.push(`${name} is invalid; allowed values: ${allowed.join(', ')}`)
  }
}

function validateOptionalPositiveInt(name: string, issues: EnvIssue[]): void {
  const raw = process.env[name]
  if (!raw) return

  const parsed = Number.parseInt(raw, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    issues.push({
      name,
      message: `${name} must be a positive integer`,
      required: false,
    })
  }
}

function validateDatabaseUrl(issues: EnvIssue[]): void {
  const databaseUrl = readRequiredString('DATABASE_URL', issues)
  if (!databaseUrl) return

  try {
    const parsed = new URL(databaseUrl)
    const protocol = parsed.protocol.replace(':', '')
    if (!protocol.startsWith('postgres')) {
      issues.push({
        name: 'DATABASE_URL',
        message: 'DATABASE_URL must use a postgres/postgresql URL',
        required: true,
      })
    }
  } catch {
    issues.push({
      name: 'DATABASE_URL',
      message: 'DATABASE_URL must be a valid URL',
      required: true,
    })
  }
}

function validateSessionSecret(issues: EnvIssue[]): void {
  const secret = readRequiredString('SESSION_SECRET', issues)
  if (!secret) return

  if (secret.length < 32) {
    issues.push({
      name: 'SESSION_SECRET',
      message: 'SESSION_SECRET must be at least 32 characters',
      required: true,
    })
  }
}

function validateAdminPinHash(issues: EnvIssue[]): void {
  try {
    const hash = getAdminPinHash()
    if (!hash || hash.trim().length === 0) {
      issues.push({
        name: 'ADMIN_PIN_HASH',
        message: 'ADMIN_PIN_HASH is required and must be non-empty',
        required: true,
      })
    }
  } catch (error) {
    issues.push({
      name: 'ADMIN_PIN_HASH',
      message:
        error instanceof Error ? error.message : 'ADMIN_PIN_HASH is invalid',
      required: true,
    })
  }
}

export function validateServerEnv(): ServerEnvValidationResult {
  const issues: EnvIssue[] = []
  const warnings: string[] = []

  validateDatabaseUrl(issues)
  readRequiredString('OPENAI_API_KEY', issues)
  readRequiredString('CRON_SECRET', issues)
  validateSessionSecret(issues)
  validateAdminPinHash(issues)

  validateOptionalAllowedValue('IMAGE_MODEL', ALLOWED_IMAGE_MODELS, warnings)
  validateOptionalAllowedValue('IMAGE_QUALITY', ALLOWED_IMAGE_QUALITIES, warnings)
  validateOptionalAllowedValue('IMAGE_SIZE', ALLOWED_IMAGE_SIZES, warnings)

  validateOptionalPositiveInt('MAX_DAILY_PER_DEVICE', issues)
  validateOptionalPositiveInt('MAX_DAILY_PER_IP', issues)
  validateOptionalPositiveInt('MAX_DAILY_GLOBAL', issues)

  if (process.env.OPENAI_MODEL) {
    warnings.push(
      'OPENAI_MODEL is set but unused by the current codebase. Use IMAGE_MODEL for image generation.'
    )
  }

  return {
    ok: issues.length === 0,
    issues,
    warnings,
  }
}

let startupValidated = false

export function assertServerEnvAtStartup(): void {
  if (startupValidated || process.env.NODE_ENV === 'test') {
    return
  }

  const result = validateServerEnv()
  const shouldEnforce = process.env.NODE_ENV === 'production'

  if (!result.ok) {
    const summary = result.issues
      .map((issue) => `${issue.name}: ${issue.message}`)
      .join('; ')
    if (shouldEnforce) {
      throw new Error(`Server environment validation failed: ${summary}`)
    }
    console.warn(`env warning: startup env validation failed (${summary})`)
  }

  for (const warning of result.warnings) {
    console.warn(`env warning: ${warning}`)
  }

  startupValidated = true
}
