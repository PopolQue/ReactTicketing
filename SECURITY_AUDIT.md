# Security Audit Report — ReactTicketing (Admit)

**Date:** 2026-06-19
**Scope:** Full codebase (core library, React UI, platform SSR, Supabase, mobile scanner, examples)
**Methodology:** OWASP Top 10 (2021) + manual code review + dependency analysis

---

## Executive Summary

The codebase demonstrates strong security awareness in its database layer (RLS, search path lockdown, SECURITY INVOKER pattern) but has **critical weaknesses in the application layer**, particularly around secret management and CSRF protection. The most urgent finding is that **HMAC signing keys are compiled into the client-side JS bundle**, rendering the entire QR/scan session trust model ineffective for anyone who inspects the bundle.

**Risk Rating: HIGH**

---

## Findings by Severity

### 🔴 CRITICAL (2)

#### C-1: HMAC Signing Secrets Leaked to Client Bundle

| Attribute  | Value                                                                                                                                                                                                                                  |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **File**   | `platform/src/lib/Admit/mappers.ts:217-218`                                                                                                                                                                                            |
| **OWASP**  | A02:2021 — Cryptographic Failures                                                                                                                                                                                                      |
| **Detail** | `VITE_SCAN_SESSION_SECRET` and `VITE_SUPABASE_QR_SECRET` are imported via `import.meta.env`, which Vite inlines into the client-side JS bundle at build time. Anyone who views the browser bundle can extract these 32-byte HMAC keys. |
| **Impact** | Attackers can forge valid scan session tokens (impersonate any scanner account) and sign fraudulent QR code payloads.                                                                                                                  |
| **Fix**    | Move HMAC key verification server-side (Supabase RPC). Remove the client-side signing path.                                                                                                                                            |

#### C-2: Zero CSRF Protection

| Attribute  | Value                                                                                                                                                           |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **File**   | `platform/server.js` (Entire API surface)                                                                                                                       |
| **OWASP**  | A01:2021 — Broken Access Control                                                                                                                                |
| **Detail** | No CSRF tokens, no SameSite cookie configuration, no anti-CSRF headers on any endpoint. The `POST /api/create-payment-intent` endpoint is particularly exposed. |
| **Impact** | An attacker can trick authenticated users into creating unintended payment intents or performing state-changing operations.                                     |
| **Fix**    | Add `SameSite=Strict` or `Lax` cookie config; add CSRF token validation on state-changing endpoints.                                                            |

---

### 🟠 HIGH (4)

#### H-1: `.env.local` Committed with Live Credentials

| Attribute  | Value                                                                                                                               |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **File**   | `.env.local`                                                                                                                        |
| **OWASP**  | A05:2021 — Security Misconfiguration                                                                                                |
| **Detail** | Live Supabase DB password (`yfQvr9zRYkrdqjDc`), anon key, project URL, and QR secret are committed to git in `.env.local`.          |
| **Impact** | Anyone with repo access can connect to the production Supabase instance with full DB access.                                        |
| **Fix**    | Rotate all credentials immediately. Remove file from git history with `git filter-branch` or BFG. Add `.env.local` to `.gitignore`. |

#### H-2: Hardcoded Secrets in Example Apps

| Attribute  | Value                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------ |
| **Files**  | `examples/demo-local/src/App.tsx:32-33`, `examples/supabase-template/src/App.tsx:27-28`          |
| **OWASP**  | A05:2021 — Security Misconfiguration                                                             |
| **Detail** | Example apps hardcode `scanSessionSecret` and `qrSigningSecret` with dummy/placeholder values.   |
| **Impact** | If examples are deployed as-is, HMAC security is trivially broken.                               |
| **Fix**    | Document these as placeholders that MUST be replaced; add runtime warnings if defaults detected. |

#### H-3: Weak CSP with `unsafe-inline` + `unsafe-eval`

| Attribute  | Value                                                                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **File**   | `platform/server.js:25-31`                                                                                                     |
| **OWASP**  | A05:2021 — Security Misconfiguration                                                                                           |
| **Detail** | CSP allows `script-src 'unsafe-inline' 'unsafe-eval'` and `connect-src wss: ws: https: http://127.0.0.1:* http://localhost:*`. |
| **Impact** | Defeats XSS protection entirely. Any XSS vulnerability becomes exploitable.                                                    |
| **Fix**    | Remove `unsafe-inline` and `unsafe-eval` by using nonces or hashes. Lock down `connect-src` to specific origins.               |

#### H-4: Edge Functions Have JWT Verification Disabled

| Attribute  | Value                                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **File**   | `supabase/config.toml:417,428,439,450`                                                                                                                  |
| **OWASP**  | A01:2021 — Broken Access Control                                                                                                                        |
| **Detail** | All 4 Supabase Edge Functions (`send-support-email`, `verify-url`, `notify-followers`, `generate-wallet-pass`) have `verify_jwt = false`.               |
| **Impact** | These functions are publicly invocable without authentication. The `send-support-email` function accepts user-supplied message content and sends email. |
| **Fix**    | Enable `verify_jwt = true` for functions that need auth; add request validation for public ones.                                                        |

---

### 🟡 MEDIUM (5)

#### M-1: Email HTML Injection in Support Email Function

| Attribute  | Value                                                                                                     |
| ---------- | --------------------------------------------------------------------------------------------------------- |
| **File**   | `supabase/functions/send-support-email/index.ts:30-39`                                                    |
| **OWASP**  | A03:2021 — Injection                                                                                      |
| **Detail** | User-supplied `record.message` is interpolated directly into an HTML email template via template literal. |
| **Impact** | Phishing via crafted emails from the Admit domain.                                                        |
| **Fix**    | Sanitize/escape HTML in user-supplied content before including in email.                                  |

#### M-2: Error Stack Traces Leaked to Client

| Attribute  | Value                                                                                    |
| ---------- | ---------------------------------------------------------------------------------------- |
| **File**   | `platform/server.js:161`                                                                 |
| **OWASP**  | A05:2021 — Security Misconfiguration                                                     |
| **Detail** | `res.status(500).end(e.stack)` sends full Node.js stack traces to clients on SSR errors. |
| **Impact** | Information disclosure — internal paths, dependency versions, code structure exposed.    |
| **Fix**    | Log stack traces server-side, return generic error messages to client.                   |

#### M-3: User-Supplied URLs in `<a href>` Without Validation

| Attribute  | Value                                                                                                                                                |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Files**  | `EntityClaims.tsx:145`, `ArtistClaims.tsx:67`, `ArtistDashboard.tsx:50-52`, `EventDetails.tsx:163`, `PrimaryTicketSelector.tsx:43`                   |
| **OWASP**  | A01:2021 — Broken Access Control                                                                                                                     |
| **Detail** | User/organizer-supplied URLs rendered directly in `href` attributes. React sanitizes some protocols but `javascript:` URLs can bypass in edge cases. |
| **Impact** | Potential XSS via `javascript:` protocol URLs.                                                                                                       |
| **Fix**    | Validate/allowlist URLs against known patterns. Use a URL sanitizer.                                                                                 |

#### M-4: Target="\_blank" Without `rel="noopener"`

| Attribute  | Value                                                                                                                                                      |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Files**  | `EntityClaims.tsx:145`, `ArtistClaims.tsx:67`                                                                                                              |
| **OWASP**  | A01:2021 — Broken Access Control                                                                                                                           |
| **Detail** | Uses `rel="noreferrer"` but not `rel="noopener noreferrer"`. Modern browsers treat `noreferrer` as implying `noopener`, but the combined form is standard. |
| **Impact** | Low — reverse tabnabbing risk in older browsers.                                                                                                           |
| **Fix**    | Change to `rel="noopener noreferrer"`.                                                                                                                     |

#### M-5: All Seed Accounts Share Same Password

| Attribute  | Value                                                                                                                         |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Files**  | `supabase/seed.sql:5-8`, `platform/seed.js:31-34`, `secrets`                                                                  |
| **OWASP**  | A07:2021 — Identification and Authentication Failures                                                                         |
| **Detail** | All four seed accounts (`superadmin`, `admin`, `organizer`, `fan`) use `password123`. Seed users share identical bcrypt hash. |
| **Impact** | If any seed account is compromised, all are compromised.                                                                      |
| **Fix**    | Use unique passwords per seed account. Document mandatory password change on first login.                                     |

---

### 🔵 LOW (4)

#### L-1: No Rate Limiting on Express Server

| Attribute | Value                                |
| --------- | ------------------------------------ |
| **File**  | `platform/server.js`                 |
| **OWASP** | A01:2021 — Broken Access Control     |
| **Fix**   | Add `express-rate-limit` middleware. |

#### L-2: No Request Size Limiting on Express

| Attribute | Value                                   |
| --------- | --------------------------------------- |
| **File**  | `platform/server.js`                    |
| **OWASP** | A05:2021 — Security Misconfiguration    |
| **Fix**   | Add `limit` option to `express.json()`. |

#### L-3: Scanner PIN Lockout is Client-Side Only

| Attribute | Value                                                  |
| --------- | ------------------------------------------------------ |
| **File**  | `reactticket/src/hooks/useScanAuth.ts`                 |
| **Fix**   | Add server-side rate limiting for scan account logins. |

#### L-4: PayPal Webhook Verification is Stub

| Attribute | Value                                                          |
| --------- | -------------------------------------------------------------- |
| **File**  | `reactticket-core/src/services/PayPalService.ts`               |
| **Fix**   | Implement proper signature verification before production use. |

---

## OWASP Top 10 Coverage

| Category                          | Status      | Top Findings                                                      |
| --------------------------------- | ----------- | ----------------------------------------------------------------- |
| **A01** Broken Access Control     | 🔴 CRITICAL | No CSRF; edge functions unauthenticated; no rate limiting         |
| **A02** Cryptographic Failures    | 🔴 CRITICAL | HMAC keys in client bundle; hardcoded dummy secrets               |
| **A03** Injection                 | 🟡 MEDIUM   | Email HTML injection; user URLs in href                           |
| **A04** Insecure Design           | 🟡 MEDIUM   | Client-side QR signing; client-side auth decisions                |
| **A05** Security Misconfiguration | 🟠 HIGH     | `.env.local` committed; weak CSP; stack trace leakage             |
| **A06** Vulnerable Components     | 🟢 GOOD     | npm audit runs in CI; no critical known vulns found               |
| **A07** Auth Failures             | 🟡 MEDIUM   | Weak seed passwords; no MFA; scanner PIN with client-side lockout |
| **A08** Integrity Failures        | 🟡 MEDIUM   | No Subresource Integrity on CDN scripts; no Stripe idempotency    |
| **A09** Logging Failures          | 🟢 GOOD     | PostHog analytics in place; scan events logged in DB              |
| **A10** SSRF                      | 🟢 GOOD     | No user-controlled URL fetches on server side                     |

---

## What's Done Well

1. **Database security** — RLS policies on all tables, `deny_all` on sensitive tables, `SECURITY INVOKER` wrappers with empty `search_path` on critical RPCs
2. **QR anti-screenshot** — 60-second TTL on QR codes; clock skew detection (>5min anomaly, >1hr rejection)
3. **PBKDF2 iterations** — 600,000 iterations for PIN hashing (well above OWASP minimum of 600,000 for SHA256)
4. **Constant-time comparison** — All PIN/hash comparisons use manual XOR loops, not short-circuit equality
5. **Password policy** — Min 8 chars, mixed case + digits + symbols required
6. **JWT security** — Short expiry (1h), refresh token rotation enabled, rate limited
7. **PCI compliance by design** — Stripe PaymentIntent handles card data server-side; client never touches PAN
8. **CI/CD security** — npm audit runs in CI pipeline
9. **Migration safety** — Down migrations exist for rollback; architectural debt remediation track
10. **Ticket delivery model** — QR codes generated at delivery time, not at purchase

---

## Recommended Immediate Actions

1. **Rotate all exposed credentials** (Supabase DB password, anon key, QR secret)
2. **Purge `.env.local` from git history**
3. **Move HMAC key verification to server-side** — remove `VITE_*` signing secrets from client bundle
4. **Harden CSP** — remove `unsafe-inline` and `unsafe-eval` from `script-src`
5. **Add rate limiting and CSRF protection** to Express server
6. **Enable `verify_jwt = true`** on Edge Functions
7. **Sanitize user input** in support email function
8. **Remove stack trace leakage** from error responses
