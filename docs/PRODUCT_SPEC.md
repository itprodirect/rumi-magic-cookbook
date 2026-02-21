# Rumi Magic Cookbook — POC/MVP Spec (Builder)

## Goal
A kid-safe image creator for a 9-year-old using a guided **builder** (no free-text prompts) and **parent approval**.

## Roles
- **Kid**: can create requests only (pickers + presets).
- **Parent/Admin**: approves/rejects, manages dictionary, presets, and settings.

## Routes
- **/kid**
  - Builder (pick palette/style/effects/add-ons/theme/mood + creature optional)
  - Recipe Card fields:
    - Title (pick from safe titles)
    - Ingredients (pick icons/stickers)
    - Steps (pick short step phrases)
  - Submit “Create” → request becomes **Pending**
  - “Request new word” → suggestion becomes **Pending**
- **/parent** (PIN/passkey protected)
  - Queue: pending generations + pending word suggestions
  - Approve / Reject / Edit+Regenerate
  - Dictionary manager (activate/deactivate items)
  - Presets manager
  - Settings: daily limit, retention, quality, export

## Safety defaults (non-negotiable for MVP)
- No kid free-text prompts
- No photos/uploads
- No accounts
- No personal info collection (no names, schools, locations)
- Rate limit (default 10 generations/day/device)
- Retention:
  - rejected: delete immediately
  - pending: delete after 7 days
  - approved: keep until parent deletes (or time-box if preferred)

## Generation pipeline (server only)
1) Build prompt from **approved tokens** + recipe card fields
2) Moderate the composed prompt text
3) Generate image using **gpt-image-1-mini** (low-cost)
4) Moderate the generated image before showing in Parent mode
5) Store request as **pending**
6) Parent approves → appears in Kid “Approved Gallery”

## MVP deliverables
- Seed content JSONs in /content (dictionary + presets)
- DB tables: generations, suggestions, dictionary_items (or seed tables), presets
- Endpoints:
  - POST /api/generate
  - POST /api/suggest-word
  - POST /api/admin/approve
  - POST /api/admin/reject
- Minimal UI with big tap targets (iPhone friendly)
