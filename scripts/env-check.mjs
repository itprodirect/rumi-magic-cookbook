import nextEnv from '@next/env'

const { loadEnvConfig } = nextEnv

loadEnvConfig(process.cwd(), true)

const value = process.env.ADMIN_PIN_HASH ?? ''
const result = {
  present: value.length > 0,
  len: value.length,
  startsWithDollar: value.startsWith('$'),
}

console.log(JSON.stringify(result))
