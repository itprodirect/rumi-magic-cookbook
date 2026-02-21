import { hash } from 'bcryptjs'
import fs from 'node:fs/promises'
import path from 'node:path'

const DEFAULT_PIN = '123456'
const TARGET_FILE = path.join(process.cwd(), '.env.development.local')

const hashed = await hash(DEFAULT_PIN, 12)
const escapedForNextEnv = hashed.replace(/\$/g, '\\$')

await fs.writeFile(
  TARGET_FILE,
  `ADMIN_PIN_HASH="${escapedForNextEnv}"\n`,
  'utf8'
)

console.log('Wrote .env.development.local')
