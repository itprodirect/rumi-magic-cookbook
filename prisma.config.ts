import dotenv from 'dotenv'
import { defineConfig } from 'prisma/config'

// Load .env.local (Next.js convention) for Prisma CLI
dotenv.config({ path: '.env.local' })

export default defineConfig({
  earlyAccess: true,
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
})
