# Post-Overhaul Code Review (UI/UX + Security)

Date: 2026-02-22

Scope:
- UI/UX overhaul commit `77933de` ("complete UI/UX overhaul")
- Related auth/session/env/API surfaces reviewed for security and correctness

Summary:
- No direct parent-approval bypass was found in the current flow.
- Admin API routes correctly enforce `verifySession()` before queue/approve/reject/logout actions.
- No client-side secret exposure was found in the reviewed UI files.
- No Critical findings identified.

## Critical

No Critical findings identified in the reviewed scope.

## High

### H1
File: `src/app/layout.tsx:38`
Category: UI/UX
Severity: High
Finding: Viewport metadata disables zoom (`maximumScale: 1` and `userScalable: false`), which is a significant accessibility issue for low-vision users and violates common mobile accessibility guidance.
Recommendation: Remove zoom lock settings and allow user scaling.

```ts
export const metadata: Metadata = {
  // ...
  viewport: {
    width: 'device-width',
    initialScale: 1,
  },
}
```

### H2
File: `public/manifest.json:13`
Category: Quick Win
Severity: High
Finding: The manifest references `/icon-192.png` and `/icon-512.png`, but those files are not present in `public/`. This can break PWA install prompts or produce blank/default icons.
Recommendation: Add the referenced icons (192x192 and 512x512 PNGs) or update `public/manifest.json` to point to existing assets.

## Medium

### M1
File: `src/app/api/health/route.ts:45`
Category: Security
Severity: Medium
Finding: `GET /api/health` returns the full env validation object (`checks.env`) to any caller. It does not leak secret values, but it can reveal operational details (missing env names, validation state) in production.
Recommendation: Return only coarse readiness in production, and gate detailed checks behind auth or a separate secret.

```ts
const envPayload =
  process.env.NODE_ENV === 'production'
    ? { ok: env.ok }
    : env
```

### M2
File: `next.config.ts:3`
Category: Security
Severity: Medium
Finding: No CSP or security headers are configured (`next.config.ts` is still the default stub). The app relies on React escaping, but there is no defense-in-depth header policy (CSP, X-Frame-Options, Referrer-Policy, etc.).
Recommendation: Add a `headers()` config (or middleware) with a baseline security header set, then tighten CSP iteratively to fit `next/font`, inline styles, and data URLs used by the gallery.

### M3
File: `src/app/api/admin/reject/route.ts:12`
Category: Security
Severity: Medium
Finding: `/api/admin/reject` only validates `id` as a string, while `/api/admin/approve` applies a UUID-ish format check (`src/app/api/admin/approve/route.ts:8`, `src/app/api/admin/approve/route.ts:53`). This inconsistency widens the input surface and makes validation behavior uneven across admin actions.
Recommendation: Reuse the same UUID-ish validation helper/pattern in `/api/admin/reject`.

### M4
File: `src/components/gallery/ImageViewer.tsx:82`
Category: UI/UX
Severity: Medium
Finding: The modal has `role="dialog"` and autofocuses the close button, but it does not implement a real focus trap. Keyboard users can tab out of the dialog into background page content.
Recommendation: Add focus trapping (sentinel elements or a small focus-trap utility) while the modal is open.

### M5
File: `src/components/gallery/ImageViewer.tsx:95`
Category: UI/UX
Severity: Medium
Finding: Several interactive controls are below the 44x44px touch target guideline: ImageViewer close/prev/next buttons are `h-9 w-9` (36px), and `ScrollToTop` is `h-10 w-10` (40px) in `src/components/shared/ScrollToTop.tsx:24`.
Recommendation: Increase these controls to at least `h-11 w-11` (44px) and keep icon size smaller inside the target.

### M6
File: `src/components/creation/TokenPicker.tsx:62`
Category: UI/UX
Severity: Medium
Finding: The token category tabs use `role="tablist"` / `role="tab"` / `role="tabpanel"`, but there is no keyboard arrow/home/end handling for tab navigation, and the panel uses `aria-label` instead of `aria-labelledby` to the active tab. This is a partial tabs implementation.
Recommendation: Add roving keyboard navigation and connect each panel to its owning tab via `id` + `aria-labelledby`.

### M7
File: `src/components/gallery/GalleryCard.tsx:33`
Category: Performance
Severity: Medium
Finding: The card declares hover transform classes (`hover:scale-[1.03]`, `hover:rotate-0`) and also sets `style.transform` inline (`src/components/gallery/GalleryCard.tsx:36`). Inline `transform` overrides the class-based transform utilities, so the intended hover motion is likely not applying.
Recommendation: Move rotation to a wrapper element or use a CSS variable in a shared transform string.

```tsx
style={{ ['--card-rotate' as string]: `${rotation}deg` }}
className="... [transform:rotate(var(--card-rotate))] hover:[transform:rotate(0deg)_scale(1.03)]"
```

### M8
File: `src/components/feedback/LoadingPainter.tsx:32`
Category: Code Quality
Severity: Medium
Finding: `advanceFact()` creates a `setTimeout` and returns a cleanup function (`src/components/feedback/LoadingPainter.tsx:39`), but that returned cleanup is never used by the `setInterval` caller (`src/components/feedback/LoadingPainter.tsx:43`). This leaves nested timeouts unmanaged during unmount timing windows.
Recommendation: Track the timeout in a ref and clear it in the effect cleanup, or avoid nested timers by driving the transition from a single interval state machine.

### M9
File: `src/app/kid/page.tsx`
Category: Code Quality
Severity: Medium
Finding: `src/app/kid/page.tsx` (457 lines) and `src/app/parent/page.tsx` (312 lines) still contain substantial orchestration + rendering logic in single page components. This increases regression risk after the overhaul and makes testing harder.
Recommendation: Split page containers into feature hooks/components (data loading, submit logic, preset logic, queue actions, login form, queue sections).

### M10
File: `src/app/api/dictionary/route.ts:12`
Category: Performance
Severity: Medium
Finding: `/api/dictionary` returns `tags` for every dictionary item, but the current kid UI does not use `tags` (`src/app/kid/page.tsx:26`, `src/app/kid/page.tsx:30`, `src/app/kid/page.tsx:123`). This inflates the initial payload for the builder.
Recommendation: Remove `tags` from the default response (or add an opt-in query flag for admin/debug tooling that needs them).

## Low

### L1
File: `src/app/parent/page.tsx:51`
Category: Quick Win
Severity: Low
Finding: `/parent` starts with `loggedIn = false` and only fetches queue data after a fresh login, so a valid existing admin session cookie is not restored on page refresh. Users can appear "logged out" until they log in again.
Recommendation: Probe the queue on mount (or call a lightweight auth status endpoint) and set `loggedIn` when the session is already valid.

### L2
File: `src/app/parent/page.tsx:184`
Category: UI/UX
Severity: Low
Finding: The parent PIN input uses a placeholder instead of a visible label, and action failures use `alert()` dialogs (`src/app/parent/page.tsx:125`, `src/app/parent/page.tsx:134`, `src/app/parent/page.tsx:155`). This is less accessible and feels inconsistent with the rest of the polished UI.
Recommendation: Add a visible `<label>` (or `aria-label`) and replace `alert()` with the existing `Toast` component (or inline status banners).

### L3
File: `src/components/shared/Button.tsx:30`
Category: Code Quality
Severity: Low
Finding: `src/components/shared/Button.tsx` appears to be unused in the current codebase (no imports found under `src/`). It adds maintenance surface and can drift from actual button patterns.
Recommendation: Either adopt it in shared button usage or remove it until it is needed.

