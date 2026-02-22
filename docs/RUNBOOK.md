# Today Runbook (Opus → Claude Code → Codex → Deploy)

## 0) Create a new repo (recommended)
- Repo name idea: `rumi-magic-cookbook`
- Next.js App Router + TypeScript

## 1) Drop this pack into your repo
Copy:
- /docs/*.md
- /content/*.json

## 2) Opus extended thinking review (planning pass)
Paste this prompt into Opus:

---
You are Claude Opus (extended thinking). Review the repo docs:
- docs/PRODUCT_SPEC.md
- docs/SAFETY_CONTRACT.md
- docs/DATA_MODEL.md
- docs/RECIPE_CARD_LAYOUT.md
- content/*.json (dictionary + presets)

Goals:
1) Identify safety/privacy gaps (kid-safe, under-13)
2) Identify MVP cutline and what to defer
3) Recommend defaults (retention, rate limits, approval UX)
4) Provide a step-by-step implementation plan for Claude Code:
   - file list
   - routes
   - data model choice (Prisma/Drizzle)
   - endpoint behaviors
5) Provide a red-team checklist (adversarial prompts / edge cases)

Output:
- Risks (ranked)
- Fixes (ranked)
- MVP plan (tasks in order)
---

## 3) Claude Code kickoff (implementation)
Use Opus output, then run Claude Code with:

---
Build a Next.js (App Router) TypeScript PWA for `rumi.itprodirect.com`.

Hard requirements:
- /kid builder UI with NO free-text prompts
- /parent admin with PIN login (server-verified, session cookie)
- Postgres persistence (Prisma or Drizzle)
- Endpoints:
  - POST /api/generate: compose prompt from approved tokens + recipe fields; moderate text; generate via gpt-image-1-mini; moderate image; store pending
  - POST /api/suggest-word: moderate text; store pending
  - POST /api/admin/approve: approve generation or suggestion
  - POST /api/admin/reject: reject + delete image data
- Safety:
  - enforce docs/SAFETY_CONTRACT.md rules in server prompt suffix
  - no uploads/photos in MVP
- Rate limit:
  - 10 generations/day per device_id (localStorage uuid)
- Seed:
  - load /content/*.json into DB on first run (dev command)

Deliver:
- working dev server
- migrations
- README (env vars + deploy notes)

---

## 4) Codex review (security + correctness)
Prompt for Codex:

---
Review for:
- API key safety (never in client)
- PIN/session correctness
- moderation coverage (text + image)
- rate limiting correctness
- retention auto-delete behavior
- prompt-injection resistance (no free-text)
Return:
- findings
- minimal diffs (patch plan)
---

## 5) Deploy to Vercel
- Add domain: rumi.itprodirect.com
- Set required env vars: `DATABASE_URL`, `OPENAI_API_KEY`, `ADMIN_PIN_HASH`, `SESSION_SECRET`, `CRON_SECRET`
- Optional env vars (defaults exist): `IMAGE_MODEL`, `IMAGE_QUALITY`, `IMAGE_SIZE`, `MAX_DAILY_PER_DEVICE`, `MAX_DAILY_PER_IP`, `MAX_DAILY_GLOBAL`
- Remove/ignore legacy `OPENAI_MODEL` (unused by current code)
- DNS: CNAME rumi -> Vercel target
