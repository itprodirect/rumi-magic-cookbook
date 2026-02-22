## Rumi Magic Cookbook

Kid-safe recipe-card image generator with parent approval controls.

### Demo-Ready Checklist

- Configure `.env.local` from `.env.example` (at minimum: `DATABASE_URL`, `OPENAI_API_KEY`, `ADMIN_PIN_HASH`, `SESSION_SECRET`, `CRON_SECRET`).
- Run setup: `npm install`, `npm run setup:dev-secrets`, `npm run db:migrate`, `npm run db:seed`.
- Run quality gates: `npm run lint` and `npm run build`.
- Start app with `npm run dev`.
- **Builder** (`/`): 4-step wizard (Preset → Core Picks → Extras → Review). Mood auto-defaults if skipped.
- **Generate** (`POST /api/generate`): validates tokens, moderates text, stores a **pending** request only — no image yet.
- **Approve** (`POST /api/admin/approve`): calls OpenAI Images to generate the image on approval. Model settings are env-configurable via `IMAGE_MODEL` / `IMAGE_QUALITY` / `IMAGE_SIZE` with safe defaults (`gpt-image-1.5` / `medium` / `1024x1024`).
- **Gallery** (`/gallery`): API returns `{ id, title, imageData, createdAt }` only — no tokenIds or prompt text exposed. Lightbox supports keyboard nav (arrows, ESC). Downloads named `rumi-<title>-<date>.png`.
- **Admin** (`/admin`): login with PIN; unauthenticated calls to `/api/admin/queue|approve|reject|logout` return `401`.
- **Cron** (`POST /api/cron/cleanup`): requires `Authorization: Bearer <CRON_SECRET>`.
- **Health** (`GET /api/health`): checks env validation + database connectivity (`200` healthy, `503` not ready).

### Admin PIN Hash Note

- Bcrypt hashes start with `$` and Next.js dotenv expansion may eat unescaped `$` tokens.
- Use `npm run setup:admin-pin` to generate a safe `.env.development.local`, or escape dollars as `\\$`.
- `SESSION_SECRET` must be 32+ chars. Use `npm run setup:session-secret`.
- One-shot local setup: `npm run setup:dev-secrets`.
- `OPENAI_MODEL` is a legacy/unused env var in this repo. Image generation config uses `IMAGE_MODEL`.

See `docs/SETUP.md` for full setup and endpoint details.

Built with Next.js 16, Prisma 7, Neon Postgres, and OpenAI. See `docs/SETUP.md` for full setup, endpoint details, and local demo walkthrough.
