# Security Constraints — Kid-Safe First

## Audience

The primary user is a 9-year-old child. Every design decision defaults to the safest option.

## Threat Model

| Threat | Actor | Mitigation |
|--------|-------|------------|
| Unsafe image shown to child | Image model hallucination | Double moderation (text + image) + parent approval gate |
| Free-text prompt injection | Child or sibling via suggest-word box | Sanitize → moderate → store as pending only; never enters prompt |
| API key exposure | Developer error | `server-only` import guard; no `NEXT_PUBLIC_` prefix; CI grep check |
| Parent PIN bypass | Child or sibling | Server-side bcrypt; HttpOnly cookie; brute-force lockout |
| PII in suggestions | Child typing personal info | Regex detection (names, schools, addresses, phones) + length cap |
| Rate limit bypass | Clear localStorage | Device limit + global cap enforced in DB; persistent IP limiter planned |
| XSS via stored suggestion | Crafted input | React auto-escaping; never use `dangerouslySetInnerHTML`; strip HTML chars in sanitizer |
| Cost attack | Automated requests | Device + global limits; OpenAI spending cap |

## Prompt Safety Architecture

### The prompt_text firewall

```
CLIENT (kid)                    SERVER                          OPENAI
─────────────                   ──────                          ──────
sends: "Rainbow"  ──────────►  looks up in DB:                 
                               prompt_text = "bright           
                               rainbow palette"                
                                        │                      
                               appends safety suffix           
                                        │                      
                               moderates composed text ──────► moderation API
                                        │                      
                               sends full prompt ────────────► image API
```

**Key rule:** The client NEVER sends `prompt_text`. It sends token `label` strings. The server resolves labels to prompt fragments from the database. This means:

- A tampered client payload with arbitrary prompt text is ignored (the server only accepts known labels)
- New dictionary items must be added via the database/seed, not via any client endpoint
- The suggest-word endpoint NEVER feeds into prompt composition

### Safety suffix (appended to EVERY prompt)

```
kid-safe, G-rated, cartoon illustration only, no text overlays, 
no realistic humans, no scary imagery, no weapons, no gore, 
no nudity, cute and friendly, recipe card layout, clear sections
```

### Spooky-cute guardrail (appended when spooky-cute tokens detected)

```
NOT scary, NOT horror, soft moonlight, smiling faces, 
round shapes, pastel accents, cozy and friendly
```

### Double moderation gates

1. **Pre-generation:** The composed prompt text is sent to `omni-moderation-latest`. If ANY category is flagged, generation is aborted. The kid sees "Let's try a different combo!"

2. **Post-generation:** The base64 image is sent to `omni-moderation-latest` as an image input. If flagged, the image is discarded and the request is auto-rejected. The kid sees the same friendly message.

3. **Parent review:** Even if both moderation gates pass, the parent must manually approve before the kid sees the image.

## Authentication

### Parent PIN

- Minimum 6 digits (enforced at setup time, not in code — the hash is pre-computed)
- Stored as bcrypt hash in `ADMIN_PIN_HASH` env var
- Verified server-side only via `POST /api/admin/login`
- On success: set `HttpOnly`, `Secure`, `SameSite=Strict` cookie containing HMAC-signed payload
- Cookie TTL: 30 minutes, sliding (refreshed on each authenticated request)

### Brute-force protection

- Track failed PIN attempts per IP (in-memory or simple DB counter)
- After 5 failures: lock out that IP for 60 minutes from the latest failed attempt
- Return generic "Incorrect PIN" message (no hints)

### Session verification

- Every protected `/api/admin/*` route calls `verifySession()` as its first action
- Invalid/expired/missing cookie → 401 immediately
- No session state on the server — the cookie itself contains the signed payload with expiry

## Privacy (COPPA Posture)

This app does NOT collect personal data from children. The compliance posture:

| Data Point | Collected? | Notes |
|------------|-----------|-------|
| Name | ❌ No | |
| Email | ❌ No | |
| Account | ❌ No | No accounts at all |
| Location | ❌ No | |
| Photos/uploads | ❌ No | No upload capability in V0 |
| Device fingerprint | ❌ No | |
| IP address | Transient only | Used for rate limiting; not stored persistently |
| Device UUID | ✅ Yes (random) | Generated in localStorage; not linkable to identity |
| Suggestion text | ✅ Yes | Free text from kid; sanitized, moderated, parent-reviewed |

### Data retention

| Status | Image Data | Record | Auto-cleanup |
|--------|-----------|--------|-------------|
| Rejected | Nulled immediately | Kept 30 days | Daily cron |
| Pending | Nulled after 7 days | Deleted after 7 days | Daily cron |
| Approved | Nulled after 90 days | Deleted after 90 days | Daily cron |

## Input Validation Rules

### Token selection (builder)

- Each field must reference a label that exists in `dictionary_items` with `is_active=true`
- Array fields: `effects` max 3, `addons` max 3, `ingredients` max 6, `steps` max 6
- `creature` is optional (can be null)
- `device_id` must be a valid UUID v4 format

### Suggest-word input

1. Trim whitespace
2. Reject if empty
3. Reject if > 60 characters
4. Strip all characters except: `a-z A-Z 0-9 spaces hyphens apostrophes`
5. Unicode normalize (NFKD → strip non-ASCII) to defeat homoglyph tricks
6. PII regex check: reject if matches phone, email, "my name is", school name patterns
7. OpenAI text moderation: reject if any category flagged
8. Store as `pending` suggestion

## Logging Rules

- ✅ Log: request ID, status code, moderation result (pass/fail), rate limit hits
- ❌ Never log: full composed prompt text, image base64, suggestion text, PIN attempts, IP addresses (except transient rate-limit context)
- Rationale: If logs leak, they should contain no useful content or PII
