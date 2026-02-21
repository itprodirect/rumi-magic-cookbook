import nextEnv from '@next/env'

const { loadEnvConfig } = nextEnv

loadEnvConfig(process.cwd(), true)

const adminPin = process.env.ADMIN_PIN_HASH ?? ''
const sessionSecret = process.env.SESSION_SECRET ?? ''

const result = {
  adminPinPresent: adminPin.length > 0,
  adminPinLen: adminPin.length,
  adminPinStartsWithDollar: adminPin.startsWith('$'),
  sessionSecretPresent: sessionSecret.length > 0,
  sessionSecretLen: sessionSecret.length,
}

console.log(JSON.stringify(result))
