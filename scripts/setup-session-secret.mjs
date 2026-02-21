import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

const TARGET_FILE = path.join(process.cwd(), '.env.development.local')
const KEY = 'SESSION_SECRET'

function parseValue(raw) {
  const trimmed = raw.trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim()
  }
  return trimmed
}

let content = ''
try {
  content = await fs.readFile(TARGET_FILE, 'utf8')
} catch {
  content = ''
}

const lines = content.length > 0 ? content.split(/\r?\n/) : []
const idx = lines.findIndex((line) => line.trim().startsWith(`${KEY}=`))

let current = ''
if (idx >= 0) {
  current = parseValue(lines[idx].slice(lines[idx].indexOf('=') + 1))
}

if (current.length < 32) {
  const generated = crypto.randomBytes(32).toString('hex')
  const replacement = `${KEY}="${generated}"`

  if (idx >= 0) {
    lines[idx] = replacement
  } else {
    lines.push(replacement)
  }

  const normalized = `${lines.filter((line) => line !== '').join('\n')}\n`
  await fs.writeFile(TARGET_FILE, normalized, 'utf8')
}

console.log('Wrote/updated SESSION_SECRET in .env.development.local')
