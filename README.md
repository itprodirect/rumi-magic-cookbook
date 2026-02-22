# Rumi Magic Cookbook

Kid-safe image-generation PWA for a child-friendly "recipe card" art builder with mandatory parent approval.

## Tech Stack

- Next.js 16 (App Router)
- React 19 + TypeScript (strict mode)
- Tailwind CSS v4 (`@theme` tokens in `src/app/globals.css`)
- Framer Motion (route/page transitions)
- Prisma 7 + PostgreSQL (Neon in production)
- OpenAI API (text moderation, image generation, image moderation)
- Vercel (hosting + cron)

Notes:
- The mascot component is named `LottieMascot`, but it is a CSS-built illustration (no Lottie runtime dependency).
- `npm run dev` uses `next dev --webpack` for Windows/WSL compatibility.

## Route Structure

- `/` -> redirects to `/kid`
- `/kid` -> child builder UI (token picker + style selector + submit flow)
- `/gallery` -> approved images for the current device ID
- `/parent` -> parent PIN login + approval queue UI
- `/admin` -> redirects to `/parent` (legacy route compatibility)

API routes live under `src/app/api/*` and enforce all server-side logic (auth, moderation, prompt composition, DB writes).

## Component Architecture

UI components are organized by feature:

- `src/components/creation/` -> token picker, style selector, recipe preview, create button
- `src/components/feedback/` -> toast, loading painter, confetti burst
- `src/components/gallery/` -> gallery grid/cards, modal viewer, empty state, achievement banner
- `src/components/mascot/` -> mascot illustration + speech bubble
- `src/components/shared/` -> app shell/header/nav/background/button/scroll helpers
- `src/components/layout/` -> route/page transition wrapper

Supporting UI constants:

- `src/lib/constants/token-chips.ts` -> maps DB dictionary items to visual chips (emoji/category/apiField bridge)
- `src/lib/constants/fun-facts.ts` -> rotating loading-screen facts

## Design System Overview

Defined in `src/app/globals.css` (Tailwind v4 `@theme` tokens):

- Colors:
  - Coral (primary)
  - Lavender (secondary)
  - Teal (accent)
  - Warm cream/paper/charcoal neutrals
  - Golden / sky / leaf accent colors
- Fonts:
  - `Baloo 2` (display)
  - `Nunito` (body)
- Motion tokens:
  - page entrance, fade-in, float, shimmer, chip pop, confetti, toast, mascot state animations
- Shared visual patterns:
  - rounded cards/chips, soft shadows, warm gradients, reduced-motion fallback

## Setup (Quick Start)

1. Install dependencies
2. Configure env vars
3. Run Prisma migrations + seed
4. Start the app

```bash
npm install
cp .env.example .env.local
npm run setup:dev-secrets
npm run db:migrate
npm run db:seed
npm run dev
```

Important env vars (required):

- `DATABASE_URL`
- `OPENAI_API_KEY`
- `ADMIN_PIN_HASH`
- `SESSION_SECRET` (32+ chars; required at startup/build in production mode)
- `CRON_SECRET`

Optional env vars (safe defaults exist):

- `IMAGE_MODEL`, `IMAGE_QUALITY`, `IMAGE_SIZE`
- `MAX_DAILY_PER_DEVICE`, `MAX_DAILY_PER_IP`, `MAX_DAILY_GLOBAL`

See `docs/SETUP.md` for full environment details, Vercel notes, and local demo flow.

## PWA Details (Current State)

- Web app manifest at `public/manifest.json`
- `manifest` / `themeColor` / Apple web app metadata configured in `src/app/layout.tsx`
- `start_url` is `/kid`
- `display: "standalone"` for installable app shell behavior
- No service worker/offline caching is implemented yet

## Operations and Health

- `GET /api/health` -> env + DB readiness (`200` healthy, `503` not ready)
- `GET /api/cron/cleanup` -> Vercel cron target (also supports `POST` for manual testing)
- `Authorization: Bearer <CRON_SECRET>` required for cron cleanup

## Current Testing/Verification Commands

- `npm run lint`
- `npm run test` (minimal cron handler tests)
- `npm run build`

## More Docs

- `docs/SETUP.md` -> local setup, env vars, demo flow
- `docs/RUNBOOK.md` -> deploy + cron verification steps
- `docs/REVIEW.md` -> post-overhaul deep code review findings
- `CLAUDE.md` -> agent context / architecture notes

