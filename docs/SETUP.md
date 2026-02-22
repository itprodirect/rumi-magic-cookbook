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
npm run setup:dev-secrets   # generates ADMIN_PIN_HASH + SESSION_SECRET safely

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
| `ADMIN_PIN_HASH` | Recommended: `npm run setup:admin-pin`. Manual: `node -e "require('bcryptjs').hash('YOUR_PIN', 12).then(h => console.log(h))"` — escape `$` as `\$` in .env files |
| `SESSION_SECRET` | Recommended: `npm run setup:session-secret`. Must be 32+ chars |
| `CRON_SECRET` | Run: `node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"` |
| `IMAGE_MODEL` | Optional. Allowed: `gpt-image-1.5` (default), `gpt-image-1`, `gpt-image-1-mini` |
| `IMAGE_QUALITY` | Optional. Allowed: `medium` (default), `low` |
| `IMAGE_SIZE` | Optional. Allowed: `1024x1024` (default only in V0) |
| `MAX_DAILY_PER_DEVICE` | Daily request cap per device (default `10`) |
| `MAX_DAILY_PER_IP` | Reserved for upcoming IP limiter support (default `20`) |
| `MAX_DAILY_GLOBAL` | Daily request cap across all devices (default `100`) |

Image generation env vars are runtime-validated in `/api/admin/approve`. Invalid values are ignored and safe defaults are used.
`OPENAI_MODEL` is a legacy/unused env var in this codebase; image generation uses `IMAGE_MODEL`.

### Vercel Production Env (minimum)

Required in Vercel Production:
- `DATABASE_URL`
- `OPENAI_API_KEY`
- `ADMIN_PIN_HASH`
- `SESSION_SECRET` (32+ chars)
- `CRON_SECRET`

Optional in Vercel Production (defaults apply if omitted):
- `IMAGE_MODEL`, `IMAGE_QUALITY`, `IMAGE_SIZE`
- `MAX_DAILY_PER_DEVICE`, `MAX_DAILY_PER_IP`, `MAX_DAILY_GLOBAL`

Cleanup / legacy:
- `OPENAI_MODEL` can be removed; it is not read by the current server code.

### ADMIN_PIN_HASH Troubleshooting

- Bcrypt hashes contain `$` and Next.js dotenv expansion can treat `$...` as variable references.
- Escape every dollar as `\\$` if you store the hash manually.
- Easiest safe path: run `npm run setup:admin-pin` to generate `.env.development.local`.
- `SESSION_SECRET` must be at least 32 characters.
- Generate/update it safely with `npm run setup:session-secret`.
- Or run `npm run setup:dev-secrets` to set both admin PIN hash and session secret.
- Development env load order is: `.env.development.local` then `.env.local`.

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

## Health Check Endpoint

`GET /api/health` returns env + database readiness.

- `200`: env is valid and DB is reachable
- `503`: env validation failed or DB connectivity failed

## Gallery Endpoint

`GET /api/gallery` requires `deviceId` as a query param.

```bash
curl "http://localhost:3000/api/gallery?deviceId=<uuid-v4>"
```

## Demo-Ready Checklist

- `npm run db:migrate` and `npm run db:seed` succeed.
- `npm run lint` and `npm run build` succeed.
- `/` submits valid `/api/generate` payloads and returns pending IDs.
- `/admin` login works and unauthenticated calls to `/api/admin/queue|approve|reject|logout` return `401`.
- `/gallery` shows an empty state when no approved items and an error state on API failures.
- `/api/cron/cleanup` only accepts `Authorization: Bearer <CRON_SECRET>`.

## Local Demo Flow (End-to-End)

Once you have the dev server running (`npm run dev`) and the database seeded:

1. **Open the builder** at http://localhost:3000
   - The builder is a 4-step wizard: **Preset → Core Picks → Extras → Review**
   - Step 0: pick a preset (or "Surprise Me!" / "Skip")
   - Step 1: select theme, style, palette (required); creature and title (optional)
   - Step 2: toggle effect/addon chips; open Advanced for mood, steps, ingredients (mood auto-defaults if skipped)
   - Step 3: review summary → submit
   - You should see "Recipe submitted! ID: xxxxxxxx... Status: pending"

2. **Open the admin panel** at http://localhost:3000/admin
   - Enter your PIN (the one you hashed for `ADMIN_PIN_HASH`)
   - You'll see the pending generation in the queue
   - Click "Approve" — this calls OpenAI to generate the image (takes ~10-30s)
   - If moderation passes, status changes to "approved"

3. **Check the gallery** at http://localhost:3000/gallery
   - Your approved image should appear in the grid with its title below the thumbnail
   - Click any card to open the lightbox (arrow keys / buttons to navigate, ESC to close)
   - Download button saves as `rumi-<title>-<date>.png` (falls back to ID prefix if no title)
   - The gallery API returns only `{ id, tokenIds.title, imageData, createdAt }` — no prompt text is exposed
   - The gallery is scoped to your device ID (stored in localStorage)

4. **Test rejection**: submit another recipe, then reject it from admin — verify it doesn't appear in the gallery

## Common Issues

| Problem | Fix |
|---------|-----|
| `ECONNREFUSED` on `prisma migrate` | Check DATABASE_URL and that Postgres is running |
| `Module not found: server-only` | Run `npm install server-only` |
| `Invalid API Key` | Check `.env.local` has no trailing spaces or quotes around the key |
| Port 3000 in use | `npx kill-port 3000` or use `next dev --webpack -p 3001` |
