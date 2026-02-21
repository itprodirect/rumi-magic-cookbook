# Development Setup

## Prerequisites

- **Node.js** ≥ 18.18 (LTS recommended)
- **npm** ≥ 9
- **Git**
- **PostgreSQL** (local install, Docker, or Neon free tier)

## Quick Start

```bash
# 1. Clone
git clone https://github.com/itprodirect/rumi-magic-cookbook.git
cd rumi-magic-cookbook

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env.local
# Edit .env.local with your values (see below)

# 4. Set up database
npm run db:migrate         # creates tables (prisma migrate dev)
npm run db:seed            # loads 292 dictionary items + 40 presets

# 5. Run dev server
npm run dev                # starts on http://localhost:3000
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | How to Get It |
|----------|--------------|
| `DATABASE_URL` | Neon dashboard → Connection string. Or local: `postgresql://user:pass@localhost:5432/rumi` |
| `OPENAI_API_KEY` | platform.openai.com → API Keys → Create new |
| `ADMIN_PIN_HASH` | Run: `node -e "require('bcryptjs').hash('123456', 12).then(h => console.log(h))"` (replace 123456 with your PIN) |
| `SESSION_SECRET` | Run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `CRON_SECRET` | Run: `node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"` |
| `MAX_DAILY_PER_DEVICE` | Daily request cap per device (default `10`) |
| `MAX_DAILY_PER_IP` | Reserved for upcoming IP limiter support (default `20`) |
| `MAX_DAILY_GLOBAL` | Daily request cap across all devices (default `100`) |

## Windows / WSL2 Notes

### Turbopack root resolution issue

The default `next dev` uses Turbopack, which has a known root-resolution bug on Windows/WSL2 with certain path configurations. We use the webpack bundler instead:

```json
// package.json (already configured)
"scripts": {
  "dev": "next dev --webpack"
}
```

If you see import resolution errors on `next dev`, confirm you're using `--webpack`.

### Line endings

The repo includes `.gitattributes` that enforces LF line endings. This prevents CRLF issues in:
- Prisma migration SQL files
- Shell scripts
- Any future CI configs

If you see `warning: LF will be replaced by CRLF` messages, the `.gitattributes` file will handle normalization on commit. You can also run:

```bash
git config core.autocrlf input
```

### Long path support

If you hit path-length errors with `node_modules`:

```bash
git config core.longpaths true
```

## Database Options

### Option A: Neon (recommended for simplicity)

1. Sign up at neon.tech (free tier)
2. Create a project named `rumi-magic-cookbook`
3. Copy the connection string into `DATABASE_URL`
4. Neon has a "dev branch" feature — use it for local dev to avoid touching production data

### Option B: Local PostgreSQL

1. Install PostgreSQL (Windows: use the installer from postgresql.org, or `scoop install postgresql`)
2. Create a database: `createdb rumi`
3. Set `DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/rumi`

### Option C: Docker

```bash
docker run --name rumi-pg -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=rumi -p 5432:5432 -d postgres:16
# DATABASE_URL=postgresql://postgres:dev@localhost:5432/rumi
```

## Prisma Workflow

```bash
# After changing schema.prisma:
npm run db:migrate           # or: npx prisma migrate dev --name describe_change

# Re-seed data:
npm run db:seed              # or: npx prisma db seed

# View data:
npx prisma studio

# Reset everything:
npx prisma migrate reset     # WARNING: drops all data

# Generate client after schema change:
npx prisma generate
```

### Prisma 7 Notes

This project uses **Prisma 7**, which has key differences from v6:

- **No `url` in schema.prisma** — the datasource URL is configured in `prisma.config.ts` (project root)
- **Driver adapter required** — PrismaClient uses `@prisma/adapter-pg` instead of a direct connection string
- **Config file loads `.env.local`** via dotenv (Prisma's `env()` helper only reads `.env`)
- **Seed config** is in `prisma.config.ts` under `migrations.seed`, not in `package.json` (though we keep both for compatibility)

## Testing Moderation

To test that moderation is working without burning image generation credits:

1. The `/api/generate` route has a moderation step BEFORE calling the image API
2. Compose a prompt with safe tokens and verify the moderation passes (check server logs for request ID + status)
3. To test image moderation, you'll need at least one successful generation

## Cron Cleanup Endpoint

`POST /api/cron/cleanup` requires this exact header format:

```bash
Authorization: Bearer <CRON_SECRET>
```

Example:

```bash
curl -X POST http://localhost:3000/api/cron/cleanup \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Gallery Endpoint

`GET /api/gallery` requires `deviceId` as a query param.

```bash
curl "http://localhost:3000/api/gallery?deviceId=<uuid-v4>"
```

## Common Issues

| Problem | Fix |
|---------|-----|
| `ECONNREFUSED` on `prisma migrate` | Check DATABASE_URL and that Postgres is running |
| `Module not found: server-only` | Run `npm install server-only` |
| `Invalid API Key` | Check `.env.local` has no trailing spaces or quotes around the key |
| Port 3000 in use | `npx kill-port 3000` or use `next dev --webpack -p 3001` |
