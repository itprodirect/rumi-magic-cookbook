# Architecture — V0

## Overview

Rumi Magic Cookbook is a kid-safe image generation app. A child picks from pre-approved visual tokens (palette, style, theme, etc.) to compose a "magic recipe." The server assembles a safe prompt, generates an image via OpenAI, and stores it for parent approval. The child only sees parent-approved images.

```
┌─────────────────────────────────────────────────────────┐
│                      BROWSER                            │
│                                                         │
│   /kid (builder + gallery)     /parent (PIN → admin)    │
│     │                            │                      │
│     │ token labels + device_id   │ session cookie        │
│     ▼                            ▼                      │
└─────────────────────────────────────────────────────────┘
                        │
                        │ HTTPS
                        ▼
┌─────────────────────────────────────────────────────────┐
│                   NEXT.JS API ROUTES                    │
│                   (Vercel Functions)                     │
│                                                         │
│  /api/generate          /api/admin/auth                 │
│    ├─ validate tokens     ├─ bcrypt compare             │
│    ├─ compose prompt      └─ set session cookie         │
│    ├─ moderate text                                     │
│    ├─ generate image    /api/admin/queue                │
│    ├─ moderate image      └─ return pending items       │
│    └─ store pending                                     │
│                         /api/admin/approve|reject       │
│  /api/suggest-word        └─ update status              │
│    ├─ sanitize                                          │
│    ├─ moderate text     /api/cron/cleanup               │
│    └─ store pending       └─ retention enforcement      │
│                                                         │
└──────────────┬──────────────────────┬───────────────────┘
               │                      │
               ▼                      ▼
        ┌─────────────┐       ┌──────────────┐
        │  OpenAI API │       │  Neon Postgres│
        │  - images   │       │  (Prisma ORM) │
        │  - moderation│      │              │
        └─────────────┘       └──────────────┘
```

## Data Flow: Kid Creates a Recipe Card

1. Kid picks tokens in builder UI (e.g., palette="Rainbow", style="Kawaii Sticker", ...)
2. Client sends `POST /api/generate` with `{ deviceId, palette, style, effects[], ... }`
3. Server validates: all token labels exist in `dictionary_items` and are `is_active=true`
4. Server composes prompt: joins each token's `prompt_text` + appends safety suffix
5. Server calls `omni-moderation-latest` on composed text → blocks if flagged
6. Server calls `gpt-image-1` (quality=low, 1024×1024) → receives base64 image
7. Server calls `omni-moderation-latest` on the image → blocks if flagged
8. Server inserts `generation_requests` row: status=pending, image_data=base64
9. Client shows "Your recipe card is cooking! Ask your parent to check it."
10. Parent logs in → sees pending queue → approves or rejects
11. If approved: kid's gallery shows the image. If rejected: image_data is nulled immediately.

## Data Flow: Kid Suggests a Word

1. Kid types a word/phrase (max 60 chars) in the suggestion modal
2. Client sends `POST /api/suggest-word` with `{ deviceId, phrase, category? }`
3. Server sanitizes: strip disallowed chars, enforce length, check PII patterns
4. Server runs text moderation → blocks if flagged
5. Server inserts `suggestions` row: status=pending
6. Parent reviews, approves/rejects. Approved suggestions are noted but do NOT auto-enter the dictionary in V0.

## Database Tables (Prisma)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `dictionary_items` | Token allowlist (palettes, styles, etc.) | category, label, prompt_text, is_active |
| `presets` | Pre-built token combos | name, token_ids (JSON), is_active |
| `generation_requests` | Image generation records | device_id, token_ids, status, image_data, moderation results |
| `suggestions` | Kid word suggestions | device_id, phrase, status |

## Security Boundaries

| Boundary | Enforcement |
|----------|-------------|
| Kid cannot enter free text into prompts | Builder sends token labels; server resolves from DB |
| Kid cannot see unapproved images | Gallery endpoint filters by status=approved |
| Kid cannot access parent functions | Session cookie required on all /api/admin/* routes |
| prompt_text never reaches client | Dictionary API returns labels only |
| API keys never reach client | All OpenAI calls in server-only lib files |
| Rate limits enforced server-side | DB count queries; client display is cosmetic only |

## Environments

| Env | Database | OpenAI | Domain |
|-----|----------|--------|--------|
| Local dev | Neon dev branch (or local Postgres) | Real key (low usage) | localhost:3000 |
| Production | Neon main branch | Real key (spending cap set) | rumi.itprodirect.com |
