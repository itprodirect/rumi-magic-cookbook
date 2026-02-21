import 'server-only'
import fs from 'node:fs'
import path from 'node:path'

const ADMIN_PIN_HASH_KEY = 'ADMIN_PIN_HASH'
const MISSING_HASH_MESSAGE =
  'ADMIN_PIN_HASH missing/empty. In Next.js, bcrypt hashes with $ must be escaped as \\$. Put it in .env.development.local or escape dollars.'

function parseEnvValue(raw: string): string {
  let value = raw.trim()

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim()
  }

  // Next.js dotenv expansion can consume bcrypt "$" tokens; restore escaped dollars.
  return value.replace(/\\\$/g, '$').trim()
}

function readAdminPinHashFromFile(filePath: string): string | null {
  if (!fs.existsSync(filePath)) return null

  const content = fs.readFileSync(filePath, 'utf8')
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed.startsWith(`${ADMIN_PIN_HASH_KEY}=`)) continue

    const rawValue = trimmed.slice(`${ADMIN_PIN_HASH_KEY}=`.length)
    const parsed = parseEnvValue(rawValue)
    return parsed.length > 0 ? parsed : null
  }

  return null
}

export function getAdminPinHash(): string {
  const direct = process.env.ADMIN_PIN_HASH
  if (typeof direct === 'string' && direct.trim().length > 0) {
    const parsed = parseEnvValue(direct)
    if (parsed) {
      process.env.ADMIN_PIN_HASH = parsed
      return parsed
    }
  }

  const canTryLocalFiles =
    process.env.NODE_ENV === 'development' || process.env.NEXT_RUNTIME !== 'edge'

  if (canTryLocalFiles && process.env.NEXT_RUNTIME !== 'edge') {
    const rootDir = process.cwd()
    const candidates = ['.env.development.local', '.env.local']

    for (const file of candidates) {
      const parsed = readAdminPinHashFromFile(path.join(rootDir, file))
      if (parsed) {
        process.env.ADMIN_PIN_HASH = parsed
        return parsed
      }
    }
  }

  throw new Error(MISSING_HASH_MESSAGE)
}
