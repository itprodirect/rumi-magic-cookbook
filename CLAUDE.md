# CLAUDE.md - Rumi Magic Cookbook

Agent context for work in this repo. Keep changes safe, kid-friendly, and production-focused.

## Project Overview

Rumi Magic Cookbook is a Next.js App Router PWA that lets a child build AI art from approved visual tokens (no free-text prompt entry). A parent must log in with a PIN and approve pending requests before images are generated/stored.

Core guarantees:

- No client-side secrets
- No free-text prompt composition from the kid UI
- Parent approval gate before image generation/storage
- Text and image moderation before approval

## Current Architecture

### App routes

- `/` -> redirect to `/kid`
- `/kid` -> child builder experience
- `/gallery` -> approved image gallery scoped to local `deviceId`
- `/parent` -> parent PIN login + review queue
- `/admin` -> legacy redirect to `/parent`

### API routes

- `/api/generate` -> validates payload, rate-limits, builds prompt from DB labels, moderates text, stores `pending`
- `/api/admin/login` -> bcrypt PIN verify + signed HttpOnly session cookie
- `/api/admin/queue` -> pending generations/suggestions (authed)
- `/api/admin/approve` -> generates image, moderates image, stores approved/rejected (authed)
- `/api/admin/reject` -> reject generation/suggestion (authed)
- `/api/admin/logout` -> clears session (authed)
- `/api/dictionary` -> token labels/categories for UI (no prompt text)
- `/api/presets` -> preset token bundles for quick-start
- `/api/gallery` -> approved images for `deviceId`
- `/api/cron/cleanup` -> retention cleanup, `Bearer CRON_SECRET` (GET for Vercel cron, POST for manual testing)
- `/api/health` -> env + DB readiness

### UI/component structure

- `src/components/creation/`
- `src/components/feedback/`
- `src/components/gallery/`
- `src/components/mascot/`
- `src/components/shared/`
- `src/components/layout/`

### Data and prompt-bridge pattern (important)

The kid UI uses visual chips, but the server API expects dictionary labels. Bridging happens through:

- `src/lib/constants/token-chips.ts`
  - `DB_TO_VISUAL` maps DB categories -> visual categories + API fields
  - `dictItemToChip()` converts `/api/dictionary` rows into UI chip objects
- `src/app/kid/page.tsx`
  - assembles API payload from selected chips/style/palette
- `src/lib/prompt-builder.ts`
  - resolves labels to DB `promptText` server-side and appends safety suffix

This is the main safety boundary between a playful UI and the model-facing prompt.

## File Structure Map (High-Level)

```text
src/
  app/
    layout.tsx              # app shell + fonts + nav + startup env validation
    template.tsx            # framer-motion route transition wrapper
    page.tsx                # / -> /kid redirect
    admin/page.tsx          # /admin -> /parent redirect
    kid/page.tsx            # child builder UI (client component)
    gallery/page.tsx        # gallery UI + modal viewer (client component)
    parent/page.tsx         # parent login + review queue (client component)
    api/**/route.ts         # server endpoints
  components/
    creation/               # builder UI pieces
    feedback/               # toast/loading/confetti
    gallery/                # grid/cards/modal/banner/empty states
    mascot/                 # mascot + speech bubble
    shared/                 # app shell shared UI
    layout/                 # page transition component
  lib/
    api-client.ts           # typed fetch wrapper for client components
    device-id.ts            # localStorage-backed device ID
    download.ts             # base64 image download helper
    session.ts              # signed admin session cookie
    server-env.ts           # startup/env validation
    cron-cleanup*.ts        # cron auth + cleanup logic (testable split)
    constants.ts            # limits/safety strings
    constants/
      token-chips.ts        # visual token config + DB mapping
      fun-facts.ts          # loading screen facts
```

## Key Patterns Used Throughout

### Client components

Most interactive pages/components are explicit `'use client'` modules. The repo uses:

- `apiFetch()` for uniform JSON error handling in client pages
- local state + callbacks (no global store)
- feature-folder components instead of a single giant page file (though `/kid` and `/parent` still need more splitting)

### CSS design system and animations

`src/app/globals.css` defines:

- Tailwind v4 `@theme` tokens (colors, fonts, shadows, radii)
- custom animation tokens + keyframes
- reduced-motion fallback

Prefer existing design tokens/classes before adding one-off colors or animation timings.

### Security and server-only logic

- DB/OpenAI libs use `import 'server-only'`
- Admin actions require `verifySession()`
- Cron cleanup requires `Authorization: Bearer <CRON_SECRET>`
- Prompt text never leaves the server (`/api/dictionary` excludes `promptText`)

## Known Issues / Caveats

- Build/startup env validation:
  - `src/app/layout.tsx` calls `assertServerEnvAtStartup()`
  - In production mode, missing required env vars (especially `SESSION_SECRET`) fail fast during startup/build
- Sandbox builds may fail on `next/font` network fetches (Google Fonts) even when app code is fine
- PWA manifest references icon files that are not currently present in `public/` (tracked in `docs/REVIEW.md`)

## Coding Conventions in This Repo

- TypeScript strict mode; avoid `any`
- Server components by default; use client components only when interactivity is required
- Return JSON `{ error: string }` from API route failures
- Do not expose secrets or model-facing prompt fragments to client code
- Keep kid-facing interactions highly visual and touch-friendly (44px+ targets where possible)
- Prefer reusable feature components over growing page-level monoliths
- Preserve route compatibility (`/` and `/admin` redirects) unless explicitly changing public behavior

## Useful Commands

```bash
npm run dev
npm run lint
npm run test
npm run build
npm run db:migrate
npm run db:seed
npm run env:check
```

## Docs to Check Before Changing Behavior

- `docs/SETUP.md`
- `docs/RUNBOOK.md`
- `docs/SECURITY.md`
- `docs/REVIEW.md`
- `docs/SESSION_LOG.md`

