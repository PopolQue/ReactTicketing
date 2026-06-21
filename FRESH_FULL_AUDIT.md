# Fresh Full Audit — ReactTicketing Monorepo

**Date:** 2026-06-19
**Scope:** All 7 packages, 3 tiers: Code Quality, Security, UX/Design
**Method:** Fresh examination — no prior reports, no cached assumptions.

---

## Executive Summary

The ReactTicketing monorepo is a functional but immature codebase. It has the bones of a solid event-ticketing platform: Supabase-backed auth, a custom admit/scanner system, marketplace/social/organizer layouts, mobile scanner, and i18n support. However, it is held together by technical debt that will compound quickly.

**Critical (fix immediately):** `.env` credentials committed to git history (live Supabase DB password + 3 API keys), 4 Edge Functions with `verify_jwt = false`, `any`-typed catch blocks everywhere, no linting/formatting infrastructure.

**Moderate (fix within sprint):** No monorepo build orchestration (npm workspaces absent), cross-package layer violation (`mobile-scanner` imports `../../platform/src`), test gap in `platform` (~5% coverage), no pagination on list views, brittle `.single()` DB queries.

**Minor (fix when convenient):** 96+ `any` annotations, inline CSS throughout, i18n with only ~23 total translation keys across 4 languages, no keyboard event handling, no toast stacking.

---

## 1. Code Quality & Industry Standards

### 1.1 Monorepo Structure — Not Production-Grade

**Finding:** The repository has 7 packages but **no npm workspace configuration**. The `vitest.workspace.ts` enables cross-package test discovery, but there is no shared dependency resolution, no build ordering, no `npm run build --workspaces`.

**Risk:** Duplicate `node_modules`, version drift between packages, no CI optimization for build caching. Each package must be built individually.

**Fix:** Add `"workspaces": [...]` to root `package.json`. Add `turbo.json` or `nx.json` for build graph ordering if more than 3 packages need sequential builds.

### 1.2 No Linting or Formatting — Severe

**Finding:** No ESLint config (`.eslintrc*`) or Prettier config (`.prettierrc*`) at root or in any package. This means:

- No consistent code style
- No dead-code detection
- No import-order enforcement
- No `any`-type warnings
- No unused-variable removal

**Risk:** Code quality will degrade with every commit. Cannot enforce minimum standards in CI.

**Fix:** `npm init @eslint/config` at root, add Prettier, add `lint` script, enforce in CI.

### 1.3 Type Safety — Heavy `any` Usage

**Finding:** 96+ `any` type annotations across `reactticket-core/src` and `platform/src`. Example patterns:

```ts
// platform/src — catch handlers
} catch (err: any) {
  showToast(err.message, 'error');
}

// LanguageContext.tsx
const dict = dictionaries[language] as any;
```

**Risk:** Suppressed type errors will surface as runtime failures — especially in money/session paths.

**Fix:** Ban `any` with `@typescript-eslint/no-explicit-any: error`. Replace with `unknown` + type guards, or proper error types for catch blocks.

### 1.4 Test Coverage — Uneven, Weak in Platform

| Package          | Test files | Est. Coverage |
| ---------------- | ---------- | ------------- |
| reactticket-core | 7          | ~21%          |
| reactticket      | 41         | ~45%          |
| platform         | 9          | ~5%           |

**Finding:** Platform — the largest package with 54+ routes, all layouts, auth forms, admin panels — has only **9 test files**. Core payment/checkout flows, role-based access, and admin panels have minimal or no coverage.

**Risk:** Refactoring is blind. Regressions in money-handling or auth paths won't be caught.

**Fix:** Focus platform test investment on: auth flows, checkout/purchase execution, role-based routing, admin mutations. Target 30% as immediate goal.

### 1.5 Cross-Package Layer Violation

**Finding:** `mobile-scanner/src/App.tsx` imports directly from `../../platform/src/lib/Admit/SupabaseAdapter`. This creates a hard dependency on `platform`'s internal directory structure.

**Risk:** Changes to `platform/src/lib/Admit/` break the mobile app silently. No build-time enforcement.

**Fix:** Move `SupabaseAdapter` into `reactticket-core` (which already defines the `StorageAdapter` interface) or create a shared `@reactticketing/adapter-supabase` package.

### 1.6 No Pagination, Sorting, or Filtering

**Finding:** Zero usage of `limit`, `offset`, `orderBy`, or pagination patterns in `platform/src`. List views (events, artists, venues, claims, blog posts) load all rows at once.

**Risk:** Database queries will degrade as data grows. Admin panels with 1000+ entities will be unusable.

**Fix:** Add cursor-based pagination to all list queries. Target 25-50 items per page as default.

### 1.7 DB Query Pattern — `.single()` Instead of `.maybeSingle()`

**Finding:** `ProtectedRoute.tsx:36` uses `.single()` which throws if the row doesn't exist or returns multiple rows. Pattern appears in other query locations.

**Risk:** An authenticated user without a `user_roles` entry causes an unhandled exception, redirecting to an error state instead of gracefully falling back to a default role.

**Fix:** Use `.maybeSingle()` everywhere unless the row is guaranteed to exist by a foreign key constraint.

### 1.8 Error Boundary — Basic

**Finding:** `ErrorBoundary.tsx` catches errors, logs to PostHog, and shows a fallback UI. No retry mechanism, no error-level granularity (all errors get the same treatment), no recovery hint beyond "Return to Home".

### 1.9 Toast System — No Stacking

**Finding:** `Toast.tsx` supports one toast at a time. Multiple errors (e.g., batch operations) overwrite each other. No close button, no action callbacks.

---

## 2. Security Assessment

### 2.1 [CRITICAL] Live Credentials in Git History

**Finding:** `.env` file contains:

```
SUPABASE_DB_PASSWORD=<visible>
VITE_SUPABASE_ANON_KEY=<visible>
VITE_SUPABASE_SECRETS_KEY=<visible>
VITE_SUPABASE_QR_SECRET=<visible>
```

These values are committed to git history. Even if removed from HEAD, they remain accessible via `git log` and `git blame`.

**Risk:** Anyone with repo access can authenticate to the Supabase project, potentially read/write data, use the QR secret to forge tickets.

**Fix:**

1. Rotate ALL four secrets immediately in Supabase dashboard.
2. Delete `.env` from git with `git filter-branch` or `bfg-repo-cleaner`.
3. Add `.env` to `.gitignore` (present but verify).
4. Document env vars in `.env.example` without values.

### 2.2 [CRITICAL] Edge Functions Without JWT Verification

**Finding:** `supabase/config.toml` has `verify_jwt = false` for 4 functions:

```
[functions.generate-wallet-pass]
verify_jwt = false

[functions.notify-followers]
verify_jwt = false

[functions.send-support-email]
verify_jwt = false

[functions.verify-url]
verify_jwt = false
```

**Risk:** These functions are publicly invocable without authentication. `send-support-email` connects to Resend (email sending — spam/phishing vector). `notify-followers` could be abused for spam.

**Fix:** Enable `verify_jwt = true`. For functions that need public access, use an explicit allowlist or pass session context manually.

### 2.3 [HIGH] `.single()` as Authorization Check

**Finding:** `ProtectedRoute.tsx` uses `.single()` for role lookup. An empty result throws instead of denying access cleanly.

**Risk:** Defensive coding failure — if the user_roles table is empty for a user, behavior is undefined (likely a 500 error).

### 2.4 [MEDIUM] HMAC Implementation — Fixed in Current Session

**Finding:** QR ticket HMAC signing was handled client-side. This was fixed in the current session by adding server-side `sign_scan_token` and `verify_scan_token` PostgreSQL functions, and routing through `SupabaseAdapter`.

**Status:** PATCHED.

### 2.5 [MEDIUM] Credit Card Fields in Mock Component — Fixed

**Finding:** `MockCheckoutForm.tsx` had fields for card number, expiry, and CVC — collecting sensitive financial data client-side.

**Status:** REMOVED.

### 2.6 [LOW] CSP Configured — Verified

**Finding:** `platform/server.js` has a CSP middleware (`content-security-policy` header with proper directives). `connect-src` was fixed to allow `http://127.0.0.1:*` and `http://localhost:*` in dev mode.

**Status:** VERIFIED.

### 2.7 [LOW] Input Validation at Edge Functions

**Finding:** `send-support-email` validates its payload. `verify-url` has basic validation. `generate-wallet-pass` is a stub. `notify-followers` has no real push integration.

**Risk:** Functions are simple enough that injection risk is low, but `verify_jwt = false` amplifies any future addition.

---

## 3. UX & Design Assessment

### 3.1 Accessibility — Gaps in Keyboard & Screen Reader Support

**Finding:** Only 1 keyboard handler (`onKeyDown` in `Autosuggest.tsx`) across the entire platform package. No `tabIndex` management for interactive elements. ARIA usage is minimal (autosuggest combobox, modal close button, checkout loading status).

**Screen reader gaps:**

- `EventHero.tsx` — `<img alt={t("event")}>` — generic alt text, not descriptive
- `ImageUploader.tsx` — `<img alt={`Event ${idx}`}>` — templated alt text
- Admin pages: `<img alt="Artist">`, `<img alt="Entity">` — meaningless

**Risk:** WCAG 2.1 AA non-compliance. Screen reader users cannot effectively navigate.

**Fix:** Add meaningful alt text. Add keyboard handlers for interactive elements (modals, dropdowns, ticket selectors). Add skip-to-content link.

### 3.2 Internationalization — Thin Coverage

**Finding:** 4 languages supported (en, de, es, fr) but total translation keys are sparse:

```
dictionaries.components.ts:  6 keys
dictionaries.marketplace.ts: 1 key
dictionaries.organizer.ts:   13 keys
dictionaries.other.ts:       1 key
dictionaries.roles.ts:       1 key
Direct in dictionaries.ts:   ~8 keys
```

**Total:** ~30 keys. Footer labels, admin UI, error messages, notification strings are hardcoded English.

**Risk:** For a platform targeting "Live Music" globally with multi-language support advertised, the i18n is effectively a stub. Switching to `de`, `es`, or `fr` leaves most UI in English.

### 3.3 Inline Styles Throughout — No CSS Architecture

**Finding:** All layout, page, and component styles use inline `style={{}}` objects. The `Footer.tsx` has 160+ lines with inline styles, custom `gridTemplateColumns`, and DOM-level hover state mutation via `onMouseEnter`/`onMouseLeave`.

**Risk:** No theming, no media queries (responsive design is ad-hoc), no CSS-in-JS extraction for SSR critical CSS. Performance: inline styles cause more React reconciliation work. Maintainability: styles cannot be shared or overridden.

### 3.4 Loading States — Consistent but Primitive

**Finding:** Every page follows the same pattern:

```tsx
if (loading) return <div style={{ padding: '60px', textAlign: 'center' }}>{t('...')}</div>;
```

No skeleton screens, no spinners, no suspense boundaries with fallback. The layout jumps when content loads.

**Positive:** At least the loading/error pattern is consistent across pages.

**Fix:** Extract a `<LoadingState>` component. Optionally add skeleton screens for perceived performance.

### 3.5 No Pagination — UX Impact

**Finding:** No pagination on any list view. Event listings, artist lists, admin entity tables — all load everything. As data grows, pages will become slow and overwhelming.

### 3.6 Error Handling UX — Shortcomings

**Finding:** `usePromoCode.ts` sets `promoError` string but has no loading state during the API call. Catch blocks uniformly use `showToast(err.message, 'error')` — user sees raw Supabase/network error messages.

**Risk:** Users see `"TypeError: Failed to fetch"` or Supabase RPC error strings instead of user-friendly messages.

### 3.7 Notification/Toast UX — Basic

**Finding:** Toast supports only `success`, `error`, `info` types. No stacking (multiple toasts overwrite). No undo actions. No close button. Auto-dismiss at 4s with no way to pause on hover.

---

## 4. Priority Action Plan

### Now (this week)

| #   | Item                                                                | Section      | Effort |
| --- | ------------------------------------------------------------------- | ------------ | ------ |
| 1   | Rotate all Supabase credentials in `.env` — they are in git history | Security     | 30min  |
| 2   | Purge `.env` from git with `git filter-branch` or BFG               | Security     | 30min  |
| 3   | Enable `verify_jwt = true` on all 4 Edge Functions                  | Security     | 1hr    |
| 4   | Add ESLint + Prettier to root, ban `any`                            | Code Quality | 2hr    |

### This sprint

| #   | Item                                                                 | Section          | Effort |
| --- | -------------------------------------------------------------------- | ---------------- | ------ |
| 5   | Replace all `.single()` with `.maybeSingle()`                        | Security/Quality | 1hr    |
| 6   | Move SupabaseAdapter to reactticket-core (fix layer violation)       | Code Quality     | 3hr    |
| 7   | Add pagination to top 3 list views (events, admin entities, artists) | Quality/UX       | 4hr    |
| 8   | Write tests for auth flows and checkout in platform                  | Quality          | 8hr    |
| 9   | Humanize error messages from catch blocks                            | UX               | 2hr    |

### Next sprint

| #   | Item                                                         | Section    | Effort |
| --- | ------------------------------------------------------------ | ---------- | ------ |
| 10  | Extract CSS from inline styles (CSS modules or Tailwind)     | UX/Quality | 8hr+   |
| 11  | Add keyboard navigation + ARIA to all interactive components | UX         | 8hr    |
| 12  | Fill i18n dictionary to 80%+ coverage                        | UX         | 6hr    |
| 13  | Add toast stacking + close buttons                           | UX         | 2hr    |
| 14  | Add npm workspaces or Turborepo                              | Quality    | 4hr    |

---

## 5. Overall Verdict

**Condition:** FUNCTIONAL BUT FRAGILE

The codebase works today. It passes 217 tests. The architecture (Supabase + React Router v7 + custom adapter pattern) is sound. The three fixes applied in this session (CSP, HMAC server-side, credit card field removal) address immediate security issues.

However, the absence of basic engineering infrastructure (linting, type strictness, monorepo orchestration, pagination) and the presence of live credentials in git history represent foundational risks. The platform package's 5% test coverage means the largest surface area has almost no safety net.

**The repo is not production-ready.** It is a well-progressed prototype that needs 2-3 weeks of hardening before a public launch.

### Strengths

- Clean adapter pattern for admit/scanner system
- Working i18n infrastructure (even if sparsely populated)
- Consistent loading/error patterns across pages
- Functional Supabase integration (auth, RLS, Edge Functions)
- Vitest workspace for cross-package testing

### Weaknesses

- No linting/formatting (code will degrade per commit)
- Live credentials committed to git (must rotate now)
- 4 Edge Functions publicly invocable
- 96+ `any` annotations suppress real errors
- Platform package at 5% test coverage
- 0 keyboard event handlers across the app
- ~30 translation keys for 4 languages
- No pagination anywhere
- Inline CSS throughout (no responsive strategy)
