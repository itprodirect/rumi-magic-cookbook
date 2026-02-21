# CLAUDE.md — Rumi Magic Cookbook

> Kid-safe image-generation PWA for a 9-year-old. Safety first, always.

## Project

- **Stack:** Next.js 16 (App Router) · TypeScript · Tailwind · Prisma 7 · Postgres (Neon)
- **Domain:** rumi.itprodirect.com
- **Deploy:** Vercel
- **Dev note:** Use `npm run dev` (runs `next dev --webpack`). Turbopack has root-resolution issues on Windows/WSL2.

## Commands

```bash
npm run dev          # next dev --webpack (port 3000)
npm run build        # next build
npm run lint         # eslint src/
npm run db:migrate   # prisma migrate dev
npm run db:seed      # prisma db seed (292 items, 40 presets)
npx prisma studio    # visual DB browser
npx prisma generate  # regenerate client after schema changes
```

## Env Vars

All secrets are in `.env.local` (never committed). See `.env.example` for the full list.

- `OPENAI_API_KEY` — server-only, never prefix with `NEXT_PUBLIC_`
- `DATABASE_URL` — Neon connection string (prod) or local Postgres (dev)
- `ADMIN_PIN_HASH` — bcrypt hash of the 6-digit parent PIN
- `SESSION_SECRET` — 64-char hex string for HMAC cookie signing
- `CRON_SECRET` — secret for Vercel cron auth header

## Architecture

Read `docs/ARCHITECTURE.md` for the full V0 design. Key points:

- **/kid** — guided builder (pickers only, NO free-text prompts)
- **/parent** — PIN-gated admin (approve/reject queue, dictionary viewer)
- **API routes** handle all logic server-side: prompt composition, moderation, generation, storage
- **No client-side secrets** — all OpenAI calls happen in API routes with `import 'server-only'`

## Safety Rules (Non-Negotiable)

These apply to every line of code. Violations are blockers.

1. **No free-text from kid reaches the image prompt.** The builder sends token *labels*. The server looks up `prompt_text` from the DB. The suggest-word flow stores text as a pending suggestion — it NEVER enters any prompt.
2. **Safety suffix on every prompt.** Append to every composed prompt before generation:
   ```
   kid-safe, G-rated, cartoon illustration only, no text overlays, no realistic humans, no scary imagery, no weapons, no gore, no nudity, cute and friendly, recipe card layout, clear sections
   ```
3. **Double moderation.** Moderate composed text BEFORE generation. Moderate generated image BEFORE storage. Both must pass.
4. **Parent approval required.** Generated images start as `pending`. Kid only sees `approved` images.
5. **API keys server-only.** Never use `NEXT_PUBLIC_` prefix for any secret. Use `import 'server-only'` in all lib files that touch OpenAI or DB.
6. **PIN verified server-side.** Compare bcrypt hash on the server, set HttpOnly/Secure/SameSite=Strict cookie.
7. **Suggest-word sanitization.** Strip non-alphanumeric (except spaces, hyphens, apostrophes), cap at 60 chars, run PII regex, run OpenAI moderation — all before storing.
8. **prompt_text never sent to client.** Dictionary API returns `{ label, id, category, tags }` only. The model-facing prompt fragments stay server-side.

## Phases

### Phase 0 — Scaffold & Config ✅ (done)
- [x] `create-next-app` with TypeScript + Tailwind + App Router
- [x] Repo on GitHub

### Phase 1 — Data Layer ✅ (done)
- [x] `prisma/schema.prisma` (4 models: DictionaryItem, Preset, GenerationRequest, Suggestion)
- [x] `prisma.config.ts` (Prisma 7 config with `@prisma/adapter-pg`)
- [x] Initial migration (`20260221143608_init`)
- [x] `prisma/seed.ts` (load `content/*.json` into DB — 292 items, 40 presets)
- [x] `src/lib/db.ts` (Prisma singleton with adapter pattern)

### Phase 2 — Server Libraries ✅ (done)
- [x] `src/lib/constants.ts` (safety suffix, limits, config)
- [x] `src/lib/openai.ts` (client init, `server-only`)
- [x] `src/lib/prompt-builder.ts` (token labels → composed prompt + safety suffix)
- [x] `src/lib/moderation.ts` (text + image moderation via `omni-moderation-latest`)
- [x] `src/lib/rate-limit.ts` (DB-based device + global counting)
- [x] `src/lib/session.ts` (HMAC cookie create/verify/destroy, sliding 30min TTL)
- [ ] `src/lib/sanitize.ts` (suggestion input cleaning + PII check)

### Phase 3 — API Routes (in progress)
- [x] `POST /api/generate` — validate tokens → rate limit → moderate text → store pending
- [ ] `POST /api/suggest-word` — sanitize → moderate → store pending
- [x] `POST /api/admin/login` — PIN verify → session cookie (brute-force lockout)
- [x] `GET  /api/admin/queue` — pending generations + suggestions (authed)
- [x] `POST /api/admin/approve` — generate image via OpenAI → moderate image → store (authed)
- [x] `POST /api/admin/reject` — set rejected + null image (authed)
- [x] `GET  /api/gallery` — approved images for device_id
- [x] `GET  /api/dictionary` — active items (labels only, no prompt_text)
- [x] `GET  /api/presets` — active presets
- [x] `POST /api/admin/logout` — clear session
- [x] `POST /api/cron/cleanup` — retention enforcement (CRON_SECRET required)

### Phase 4 — Kid UI
- [ ] Builder page (`/kid`) with category pickers, preset selector, submit
- [ ] Approved gallery grid
- [ ] Suggest-word modal
- [ ] Rate limit badge
- [ ] Loading animation
- [ ] Mobile-first layout (48px min tap targets)

### Phase 5 — Parent UI
- [ ] PIN login screen
- [ ] Pending queue (generations + suggestions)
- [ ] Approve/reject actions
- [ ] Basic stats
- [ ] Logout

### Phase 6 — Polish & Deploy
- [ ] PWA manifest + service worker
- [ ] `vercel.json` (cron config)
- [ ] Production env vars in Vercel
- [ ] DNS: rumi.itprodirect.com → Vercel
- [ ] Smoke test on production
- [ ] OpenAI spending cap set

## File Layout

```
rumi-magic-cookbook/
├── CLAUDE.md                   ← you are here
├── .env.example
├── .gitattributes
├── prisma.config.ts            ← Prisma 7 config (datasource URL, seed)
├── prisma/
│   ├── schema.prisma           ✅
│   ├── seed.ts                 ✅
│   └── migrations/             ✅ (20260221143608_init)
├── content/                    ← spec pack token dictionaries
│   ├── palettes.json ... etc
│   └── presets.json
├── docs/
│   ├── PRODUCT_SPEC.md         ← from spec pack
│   ├── SAFETY_CONTRACT.md      ← from spec pack
│   ├── DATA_MODEL.md           ← from spec pack
│   ├── RECIPE_CARD_LAYOUT.md   ← from spec pack
│   ├── ADMIN_RUBRIC.md         ← from spec pack
│   ├── RUNBOOK.md              ← from spec pack
│   ├── ARCHITECTURE.md         ← V0 architecture
│   ├── SECURITY.md             ← security constraints
│   ├── SETUP.md                ← dev setup guide
│   └── SESSION_LOG.md          ← build session tracking
├── public/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx            → redirect to /kid
│   │   ├── kid/page.tsx        (not yet created)
│   │   ├── parent/page.tsx     (not yet created)
│   │   └── api/
│   │       ├── generate/route.ts         ✅
│   │       ├── suggest-word/route.ts     (not yet created)
│   │       ├── gallery/route.ts          ✅
│   │       ├── dictionary/route.ts       ✅
│   │       ├── presets/route.ts          ✅
│   │       ├── admin/
│   │       │   ├── login/route.ts        ✅
│   │       │   ├── queue/route.ts        ✅
│   │       │   ├── approve/route.ts      ✅
│   │       │   ├── reject/route.ts       ✅
│   │       │   └── logout/route.ts       ✅
│   │       └── cron/cleanup/route.ts     ✅
│   ├── lib/
│   │   ├── db.ts               ✅
│   │   ├── openai.ts           ✅
│   │   ├── prompt-builder.ts   ✅
│   │   ├── moderation.ts       ✅
│   │   ├── rate-limit.ts       ✅
│   │   ├── session.ts          ✅
│   │   ├── sanitize.ts         (not yet created)
│   │   └── constants.ts        ✅
│   ├── components/             (not yet created)
│   │   ├── kid/
│   │   ├── parent/
│   │   └── shared/
│   └── hooks/                  (not yet created)
│       ├── useDeviceId.ts
│       └── useRateLimit.ts
└── vercel.json                 (not yet created)
```

## Prisma 7 Notes

- Prisma 7 removed `url` from `datasource` in `schema.prisma` — it now lives in `prisma.config.ts`
- PrismaClient requires a driver adapter: `new PrismaClient({ adapter })` using `@prisma/adapter-pg`
- `next lint` was removed in Next.js 16 — use `eslint src/` directly
- Seed script uses its own `dotenv.config({ path: '.env.local' })` since tsx doesn't auto-load it

## Coding Rules for Claude Code

- **TypeScript strict mode.** No `any` unless truly unavoidable (comment why).
- **Server components by default.** Only add `'use client'` where interactivity requires it.
- **No barrel exports.** Import from specific files, not index files.
- **Error handling:** Every API route wraps in try/catch, returns proper HTTP status + JSON `{ error: string }`.
- **Logging:** `console.error` for failures. Never log full prompt text, image data, or PII to stdout.
- **Tests:** Not in V0 scope. But write code that's testable (pure functions, dependency injection for DB/OpenAI).
