# Admit  — V-Model Integration Plan
### Integrating into ReactTicketing (Supabase · React 19 · SSR · Capacitor)

**Project:** Admit  module integration into the ReactTicketing platform  
**Target codebase:** ReactTicketing monorepo (`/platform`, `/mobile-scanner`, `/supabase`)  
**Model:** V-Modell XT (adapted)  
**Version:** 2.0 — Codebase-grounded revision  
**Date:** 2026-06-07  
**Status:** Approved for execution

### Changelog

| Version | Summary |
|---|---|
| 1.0 | Initial V-Model plan against a generic React + REST target |
| 2.0 | **Full revision.** Grounded against the ReactTicketing codebase analysis. Every phase updated to reflect existing Supabase tables, RLS policies, Capacitor scanner, SSR architecture, React 19, and TEXT primary key constraint. Generic `RestAdapter` replaced by `SupabaseAdapter`. Admin auth re-routed through Supabase organizer sessions. Scanner decision resolved. New database migration plan added. |

---

## How to Read This Document

The V-Model pairs every **definition phase** (left arm, descending) with a corresponding **validation phase** (right arm, ascending). Work produced going down becomes the acceptance criteria for the matching phase going up. No right-arm phase may begin until its mirror left-arm phase is signed off.

```
  DEFINITION                               VALIDATION
  ─────────                               ──────────

L1  Stakeholder &                ══════  Acceptance Testing
    Business Requirements                & Production Sign-off
          │                                      ▲
          ▼                                      │
L2  System Requirements          ══════  System Testing
    Specification (SRS)                  (end-to-end, staging)
          │                                      ▲
          ▼                                      │
L3  Architecture &               ══════  Integration Testing
    System Design                        (subsystem, adapter,
          │                               Supabase RLS/RPC)
          ▼                                      ▲
L4  Module & Component           ══════  Unit Testing
    Design                               (services, hooks,
          │                               components)
          ▼                                      ▲
          └─────────────────────────────────────┘
                          L5
                    IMPLEMENTATION
                    (Sprint coding,
                     DB migrations,
                     code review)
```

---

## Codebase Delta — What Already Exists vs. What Must Be Built

This is the most critical section of v2.0. It prevents re-building infrastructure that ReactTicketing already provides.

### Infrastructure Already in Place

| Area | Existing asset | Location | Admit  implication |
|---|---|---|---|
| **Database — scan_accounts** | `scan_accounts` table linked to `event_id`; username + PIN credentials; not Supabase Auth | `/supabase/migrations/` | Admit 's `ScanAccount` model maps to this table. Schema delta must be assessed (§L3.4). |
| **Database — scan_events** | `scan_events` table; logs QR validation; links `scan_accounts` | `/supabase/migrations/` | Admit  `ScanEvent` model maps here. `clock_skew_anomaly` result type is new — migration needed. |
| **Database — tickets** | `tickets` table with `owner_id`, `qr_payload`, `ticket_type_id`; **TEXT primary key** | `/supabase/migrations/` | Admit  must generate UUID strings manually on insert via `crypto.randomUUID()` — same pattern as existing event creation. |
| **Database — ticket_types** | `ticket_types` table; linked to `events` | `/supabase/migrations/` | Maps to `TicketTypeConfig`. Admit  promo code engine is new — `promo_codes` table is a net-new migration. |
| **Database — events** | `events` table with `TEXT` PK; `theme_customization` JSONB | `/supabase/migrations/` | Admit  `EventConfig` reads from here. `scanSessionSecret` and `adminKey` must not be stored in this table — see §L3.5. |
| **Database — orders** | `orders` table | `/supabase/migrations/` | Maps to Admit  `Order`. |
| **Authentication — organizers** | `organizer_profiles` + Supabase Auth; role stored in `user_roles` | `/platform/src/` | Admit  admin panel does **not** use its bcrypt `adminKey` in ReactTicketing. It gates on `role = 'organizer'` via the active Supabase session instead — see AD-01. |
| **Authentication — scanners** | `scan_accounts` PIN-based; not Supabase Auth users | `/supabase/` | Confirmed: Admit 's scan account auth model is architecturally identical to what ReactTicketing already uses. The SupabaseAdapter bridges them. |
| **Mobile scanner** | Capacitor app (`/mobile-scanner`) wrapping a web view | `/mobile-scanner/` | Admit 's `<ScannerView>` will become the web view inside the Capacitor app, replacing the current scanner page. See AD-02. |
| **RLS policies** | Heavily parameterised RLS on all tables | `/supabase/migrations/` | New policies required for `promo_codes` table and any new columns. Existing `scan_accounts` / `scan_events` RLS must be audited. |
| **SECURITY DEFINER RPCs** | `buy_resale_ticket`, `promote_admin_by_email` — all with `REVOKE EXECUTE FROM public/anon` | `/supabase/migrations/` | New Admit  RPCs (`validate_ticket`, `issue_tickets`) must follow identical REVOKE pattern. |
| **SSR** | Express-based SSR in `/platform` | `/platform/src/server.ts` | Admit  uses Canvas API and `crypto.subtle` — both are browser-only. All Admit  components must be dynamically imported client-side with `typeof window !== 'undefined'` guards. See §L3.6. |
| **QR rendering** | `<TicketCard />` renders `qr_payload` | `/platform/src/components/TicketCard.tsx` | Admit 's `<QRCode>` component replaces inline QR rendering in `TicketCard.tsx`. The `qr_payload` format must align — see §L3.7. |
| **Checkout flow** | `CheckoutModal.tsx` inserts `order` + `ticket` records directly via Supabase client | `/platform/src/pages/marketplace/` | Admit 's `onCheckout` callback wraps the existing CheckoutModal logic. No re-write of payment flow. |
| **Theming** | `theme_customization` JSONB on `events` drives CSS for Pro-tier organizers | `/platform/src/` | Admit 's `theme` prop is populated from this JSONB at the `<Admit >` mount site. |
| **TEXT PKs** | `events.id` and `tickets.id` are `TEXT`, not Postgres `UUID` with default | `/supabase/` | `SupabaseAdapter` must call `crypto.randomUUID()` before every `INSERT` into these tables, mirroring the existing pattern in organizer event creation. |

### Net-New Work Required

| Area | What must be built | Owner |
|---|---|---|
| `SupabaseAdapter` | Implements Admit 's `StorageAdapter` interface against the existing Supabase tables | FE + BE |
| `promo_codes` table | New Supabase migration; with RLS; with `SECURITY DEFINER` RPC for atomic usage increment | BE |
| `validate_ticket` RPC | `SECURITY DEFINER` Postgres function; enforces unique-admit constraint atomically; verifies scan session token server-side | BE |
| `scan_accounts` schema delta | Adds `credential_version`, `assigned_location`, `last_login_at` columns if not present | BE |
| `scan_events` schema delta | Adds `clock_skew_seconds`, `scanned_by_account_name` (denormalised) columns | BE |
| Admit  `ScannerView` in Capacitor | Replace current mobile scanner web view with Admit  `<ScannerView>` | FE |
| `scanSessionSecret` storage | Supabase Vault (not `events` table); fetched server-side only | BE + SEC |
| SSR dynamic import wrappers | Lazy-load all Admit  components to prevent Canvas/crypto from running on the Express SSR server | FE |
| `<Admit >` mount sites | Add to `EventDetails.tsx` (storefront), `ManageEvent.tsx` (admin panel), `/scan` route (scanner) | FE |
| Organizer auth gate (replaces bcrypt adminKey) | Admin panel access checks `user_roles.role = 'organizer'` via Supabase session, not Admit 's bcrypt key | FE + BE |

---

## Phase Overview & Timeline

| Phase | Type | Duration | Dependencies |
|---|---|---|---|
| L1 — Stakeholder Requirements | Definition | Week 1 | None |
| L2 — System Requirements (SRS) | Definition | Week 2 | L1 closed |
| L3 — Architecture & System Design | Definition | Week 3–4 | L2 closed |
| L4 — Module & Component Design | Definition | Week 4–5 | L3 closed |
| L5 — Implementation | Build | Week 6–11 | L4 closed |
| L4′ — Unit Testing | Validation | Week 8–11 (parallel) | L5 modules complete |
| L3′ — Integration Testing | Validation | Week 12–13 | L4′ closed |
| L2′ — System Testing | Validation | Week 14–15 | L3′ closed |
| L1′ — Acceptance & Go-Live | Validation | Week 16 | L2′ closed |

**Total estimated duration: 16 weeks** (+1 week vs v1.0 plan due to database migration complexity and Capacitor integration work)

---

## Roles & Responsibilities

| Role | Abbrev. | Responsibilities |
|---|---|---|
| Product Owner | PO | Owns L1 requirements; signs off L1′ acceptance |
| Lead Developer | LD | Owns L3–L4 design; leads L5 implementation; owns SupabaseAdapter |
| Frontend Developer(s) | FE | React components, hooks, SSR guards, Capacitor integration |
| Backend / Database Developer | BE | Supabase migrations, RLS policies, SECURITY DEFINER RPCs, Vault config |
| QA Engineer | QA | Test plans, L4′–L2′ execution, BrowserStack + real device testing |
| Security Reviewer | SEC | RLS audit, REVOKE pattern verification, Vault review, token security |
| DevOps / Infra | DO | CI/CD pipeline, staging environment, deployment, rollback plan |
| Stakeholder / Event Organiser | STK | L1 inputs; UAT participant; crew PIN distribution |

---
---

# L1 — Stakeholder & Business Requirements

> **Mirror:** L1′ Acceptance Testing & Production Sign-off

## Purpose

Capture what the business and event operators need from the integrated system, expressed in user-facing language. These requirements are technology-agnostic and become the acceptance criteria for the final go-live gate.

---

## L1.1 Business Goals

| ID | Goal | Status in existing codebase |
|---|---|---|
| BG-01 | Sell event tickets directly on the platform without a third-party ticketing service | ✅ Core purchase flow exists; Admit  extends it |
| BG-02 | Support multiple ticket tiers (GA, VIP, Early Bird) with independent pricing and capacity | ✅ `ticket_types` table exists; Admit  adds admin UI |
| BG-03 | Issue digital tickets with QR codes immediately after payment | ✅ Exists in `CheckoutModal.tsx`; Admit  standardises QR payload format |
| BG-04 | Crew staff validate tickets at the door via phone camera — no admin access | ✅ `scan_accounts` + Capacitor app exist; Admit  replaces the web view |
| BG-05 | Generate and distribute free and discounted promo codes | 🔴 Net-new; `promo_codes` table does not exist |
| BG-06 | Real-time entry statistics during the event | 🟡 `scan_events` table exists; dashboard UI is net-new |
| BG-07 | Integration must not break existing marketplace, resale, organizer, or support flows | ✅ Constraint; verified at L2′ + L1′ |
| BG-08 | No new third-party SaaS subscriptions | ✅ Supabase already licensed; Admit  is zero external runtime deps |
| BG-09 | Secondary market (resale) must remain fully functional after integration | ✅ `resale_listings` + `buy_resale_ticket` RPC must be untouched |
| BG-10 | Pro-tier organizer theming must continue to work on all Admit -rendered views | 🟡 `theme_customization` JSONB must flow into Admit 's `theme` prop |

---

## L1.2 User Stories

### Fan / Buyer

| ID | As a… | I want to… | So that… |
|---|---|---|---|
| US-B-01 | Fan | Browse ticket tiers on an event page and see live remaining capacity | I know which tiers are available before buying |
| US-B-02 | Fan | Add multiple ticket tiers to a cart in a single session | I can buy for myself and friends at once |
| US-B-03 | Fan | Apply a promo code at checkout | I can redeem a discount or complimentary ticket |
| US-B-04 | Fan | Receive a rendered ticket card with a QR code immediately after payment | I have proof of purchase I can show at the door |
| US-B-05 | Fan | Download my ticket as a PNG | I can save it offline or print it |
| US-B-06 | Fan | Still access my wallet and list tickets for resale after Admit  integration | The secondary market works exactly as before |

### Organizer

| ID | As an… | I want to… | So that… |
|---|---|---|---|
| US-A-01 | Organizer | Manage ticket tiers (create, edit, archive, reorder) inside my existing event dashboard | I control what goes on sale and when, from one place |
| US-A-02 | Organizer | Generate single and bulk promo codes with configurable discount rules | I can run promotions and give complimentary access |
| US-A-03 | Organizer | Create scanner accounts with usernames and PINs for door staff | Crew can authenticate on their phone without a full platform account |
| US-A-04 | Organizer | Deactivate or reset a scanner account's PIN at any time | I can revoke access immediately if a device is lost |
| US-A-05 | Organizer | View a live scan dashboard with per-account breakdowns and anomaly alerts | I can monitor entry in real time from my phone or laptop |
| US-A-06 | Organizer | See my Pro-tier event theme applied on all Admit -rendered ticket cards | Visual consistency between my event page and issued tickets |

### Crew / Scanner

| ID | As a… | I want to… | So that… |
|---|---|---|---|
| US-S-01 | Crew member | Log in with a username and PIN on the scanner page on my phone | I can authenticate without a full platform account |
| US-S-02 | Crew member | Open my rear camera and scan a ticket QR code | I can admit guests quickly with one hand |
| US-S-03 | Crew member | See an immediate green / red result with the guest's name and tier | I know instantly whether to admit the person |
| US-S-04 | Crew member | Enter a code manually if the camera is denied or fails | I am not blocked if the camera is unavailable |
| US-S-05 | Crew member | Be logged out automatically when my session expires | The device is safe if I leave it unattended |

---

## L1.3 Constraints & Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NF-01 | Performance | Event page with Admit  storefront must achieve First Interactive < 2 s on throttled 4G (Lighthouse throttled mode) |
| NF-02 | Performance | QR scan-to-result < 1.5 s median across 10 scans on a mid-range 2022 Android device |
| NF-03 | Compatibility | All flows functional on: Chrome 124+, Safari 17+, Firefox 125+, iOS Safari 16+ (Capacitor wrapper), Android Chrome 120+ |
| NF-04 | Accessibility | WCAG 2.1 AA on storefront and organizer panel; WCAG AA Large Text on scanner UI for outdoor / low-light use |
| NF-05 | Security | No plain-text PIN, `scanSessionSecret`, or HMAC signing key may exist in client bundles, environment variables exposed to the browser, or the `events` table |
| NF-06 | Security | Only a crew member with a valid scan session may call the `validate_ticket` RPC; RLS and `SECURITY DEFINER` enforce this at the database layer |
| NF-07 | Regression | No existing platform route, CSS class, JS global, Supabase query, or `buy_resale_ticket` RPC must be modified by the integration |
| NF-08 | Dependencies | Admit 's own package must list only `react` and `react-dom` as runtime dependencies; `@supabase/supabase-js` lives in `/platform`, not in the Admit  package |
| NF-09 | SSR | No Admit  component may execute Canvas API or `crypto.subtle` during the Express SSR pass; all such components must be dynamically imported client-side |
| NF-10 | Data integrity | The `buy_resale_ticket` RPC must remain the sole path for ticket ownership transfers; Admit  must never directly mutate `tickets.owner_id` |
| NF-11 | Database conventions | All new `INSERT` operations on `events`, `tickets` tables must manually provide a `crypto.randomUUID()` string as the TEXT primary key |

---

## L1.4 Deliverables & Exit Gate

| Deliverable | Owner | Format |
|---|---|---|
| Business Goals register (BG-01 – BG-10) with codebase status column | PO + LD | This document |
| User Story backlog with MoSCoW priorities | PO | Linear / Jira epic |
| Non-Functional Requirements register (NF-01 – NF-11) | PO + LD | This document |
| Codebase Delta table (exists vs. net-new) | LD | This document |

**Exit gate:** PO and STK have reviewed and signed off all user stories and NFRs. Delta table reviewed by LD and BE. All disputes resolved. Baselined in version control.

---
---

# L2 — System Requirements Specification (SRS)

> **Mirror:** L2′ System Testing

## Purpose

Translate business goals into precise, testable system requirements scoped to the actual ReactTicketing codebase. Every requirement references the affected file, table, or RPC where known.

---

## L2.1 Functional Requirements

### Storefront (mount site: `EventDetails.tsx`)

| ID | Requirement | Existing code affected | Trace |
|---|---|---|---|
| FR-ST-01 | The storefront shall render all `visible: true` ticket tiers from `ticket_types` where `event_id` matches, showing name, description, price (locale-formatted), and live remaining capacity computed as `capacity - COUNT(tickets WHERE ticket_type_id AND status != 'cancelled')` | `useTicketTiers.ts`, `PrimaryTicketSelector.tsx` | US-B-01 |
| FR-ST-02 | The storefront shall enforce per-tier `max_per_order` and cross-cart `maxOrderSize` limits | `PrimaryTicketSelector.tsx` | US-B-02 |
| FR-ST-03 | If a ticket tier's `is_external` flag is set, the Admit  storefront shall not render; the existing external redirect button (`external_ticket_url`) must remain the only visible CTA | `PrimaryTicketSelector.tsx` (existing bypass) | US-B-01 |
| FR-ST-04 | The storefront shall accept a promo code, validate it against the `promo_codes` table (active, not expired, not exhausted, scope matches), and reflect the discount in the order summary | **Net-new:** `promo_codes` table (to be migrated) | US-B-03 |
| FR-ST-05 | On checkout, the system shall invoke the existing `CheckoutModal.tsx` flow wrapped in Admit 's `onCheckout` callback; Admit  awaits `"confirmed"` before issuing tickets | `CheckoutModal.tsx` (wrapped, not replaced) | US-B-04 |
| FR-ST-06 | On order confirmation, the system shall generate one `IssuedTicket` per unit, inserting into `tickets` with a manually-generated `crypto.randomUUID()` TEXT PK and the `TF1.<eventId>.<ticketId>.<hmac>` QR payload | `tickets` table; `crypto.randomUUID()` pattern from `CreateEvent.tsx` | US-B-04 |
| FR-ST-07 | The system shall invoke `onTicketIssued(ticket, assets)` for each ticket immediately after generation, providing a PNG blob for delivery | Email handler in `/platform` | US-B-04, US-B-05 |
| FR-ST-08 | Cart state (items, quantities, applied promo) shall be persisted to `sessionStorage` under `tf_cart_<eventId>` and restored on page reload within the same tab | **Net-new** in Admit  | US-B-02 |
| FR-ST-09 | Free or fully-discounted orders shall bypass `onCheckout`; tickets shall be issued directly | **Net-new** in Admit  | US-B-03 |

### Organizer Admin Panel (mount site: `ManageEvent.tsx`)

| ID | Requirement | Existing code affected | Trace |
|---|---|---|---|
| FR-AD-01 | The admin panel shall be gated by the active Supabase session: the authenticated user must have `user_roles.role = 'organizer'` AND `organizer_profiles.id` matching `events.organizer_id` for the current event. Admit 's bcrypt `adminKey` prop is **not used** in ReactTicketing | `user_roles` table, `organizer_profiles`, Supabase Auth | US-A-01 |
| FR-AD-02 | The organizer shall manage ticket tiers (create, edit, archive, reorder) from inside `ManageEvent.tsx`; changes persist to `ticket_types` via `useTicketTiers.ts` | `useTicketTiers.ts`, `ManageEvent.tsx` | US-A-01 |
| FR-AD-03 | The organizer shall generate single and bulk promo codes with configurable discount rules, usage limits, expiry dates, and tier scope; codes are stored in the new `promo_codes` table | **Net-new:** `promo_codes` table | US-A-02 |
| FR-AD-04 | The organizer shall export a promo code batch as a UTF-8 CSV download | **Net-new** in Admit  | US-A-02 |
| FR-AD-05 | The organizer shall create scanner accounts (username, 4–8 digit PIN, optional location label) from inside `ManageEvent.tsx`; PIN is PBKDF2-hashed before writing to `scan_accounts`; plain PIN is never stored | `scan_accounts` table (exists; schema delta needed) | US-A-03 |
| FR-AD-06 | Deactivating a scan account sets `scan_accounts.active = false`; any live session tokens for that account are rejected at the next `verifyScanSession` call | `scan_accounts` table | US-A-04 |
| FR-AD-07 | Resetting a PIN increments `scan_accounts.credential_version` atomically; all in-flight session tokens encoding the old version are immediately rejected | `scan_accounts` table (schema delta: `credential_version` column) | US-A-04 |
| FR-AD-08 | The analytics dashboard shall aggregate `scan_events` for the event and display: total admitted vs. issued, velocity over time, per-tier admission rate, per-account scan breakdown, duplicate/invalid counts, clock skew anomalies | `scan_events` table | US-A-05 |
| FR-AD-09 | Pro-tier organizer theme (`events.theme_customization` JSONB) shall be applied to all Admit -rendered views via the `theme` prop at mount time | `events.theme_customization` | US-A-06 |

### Scanner (mount site: `/scan/:eventId` route + Capacitor web view)

| ID | Requirement | Existing code affected | Trace |
|---|---|---|---|
| FR-SC-01 | The scanner view shall be inaccessible without a valid `ScanSession` token; `<ScannerLogin>` is shown otherwise | `ScanTickets.tsx` (replaced by Admit  `<ScannerView>`) | US-S-01 |
| FR-SC-02 | Login shall accept username and PIN; after 5 consecutive failures within 60 s the UI locks for 30 s with a countdown; lock state is persisted to `sessionStorage` | **Net-new** in Admit  | US-S-01 |
| FR-SC-03 | On successful login, a signed session token (HMAC-SHA256, 8-hour TTL) shall be stored in `sessionStorage`; it restores silently on page reload within TTL | **Net-new** in Admit  | US-S-01 |
| FR-SC-04 | The scanner shall invoke `navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })` and continuously decode QR frames | Capacitor wraps this as a native web view | US-S-02 |
| FR-SC-05 | Ticket validation shall invoke the `validate_ticket` Supabase RPC, which server-side verifies the session token and enforces the unique-admit constraint atomically | **Net-new:** `validate_ticket` RPC | US-S-02, US-S-03 |
| FR-SC-06 | `ScanService.validateTicket()` shall call `AuthService.assertScanSession()` as its unconditional first step; no session = `AuthorisationError` without touching the database | Admit  invariant | US-S-03 |
| FR-SC-07 | The scan result card shall display all result types including `clock_skew_anomaly` (admitted but flagged) with buyer name and tier name visible | `scan_events` table | US-S-03 |
| FR-SC-08 | Haptic feedback (`navigator.vibrate`) and audio tone (Web Audio API) on admit/reject; both configurable via `theme.scanFeedback`; Capacitor passes these calls through the web view natively | Capacitor web view (vibration supported) | US-S-03 |
| FR-SC-09 | Manual ticket code entry shall be available as a fallback | Capacitor web view | US-S-04 |
| FR-SC-10 | Session expiry shall stop the camera stream, show a non-dismissable overlay, and remount `<ScannerLogin>` | **Net-new** in Admit  | US-S-05 |
| FR-SC-11 | Logout shall be a single tap: stops camera, clears token from `sessionStorage`, returns to `<ScannerLogin>` | **Net-new** in Admit  | US-S-05 |

---

## L2.2 Interface Requirements

| ID | Interface | Requirement |
|---|---|---|
| IR-01 | Admit  ↔ `EventDetails.tsx` | `<Admit >` mounted inside EventDetails; receives `event` from `useEvent` hook; `adapter` is the `SupabaseAdapter` instance; `onCheckout` wraps `CheckoutModal`; `theme` populated from `theme_customization` JSONB |
| IR-02 | Admit  ↔ `ManageEvent.tsx` | `<Admit  mode="admin">` mounted inside ManageEvent; admin gate reads from active Supabase session, not bcrypt `adminKey` |
| IR-03 | Admit  ↔ Capacitor web view | `<Admit  mode="scanner">` is the sole content of the `/scan/:eventId` route; Capacitor wraps it as a web view in `mobile-scanner` |
| IR-04 | `SupabaseAdapter` ↔ Supabase DB | All `StorageAdapter` method calls translate to Supabase client queries or RPC calls; TEXT PKs generated via `crypto.randomUUID()` before every `tickets` or `events` INSERT |
| IR-05 | `validate_ticket` RPC ↔ Supabase | `SECURITY DEFINER` Postgres function; verifies scan session HMAC server-side; enforces unique-admit constraint; follows `REVOKE EXECUTE FROM public/anon` pattern |
| IR-06 | `promo_codes` RPC ↔ Supabase | `increment_promo_usage` RPC; `SECURITY DEFINER`; atomic `usedCount++` with exhaustion check; `REVOKE EXECUTE FROM public/anon` |
| IR-07 | `scanSessionSecret` ↔ Supabase Vault | Secret stored in Supabase Vault; fetched server-side by `validate_ticket` RPC only; never returned to the browser |
| IR-08 | Admit  ↔ existing `TicketCard.tsx` | Existing `<TicketCard>` in `Wallet.tsx` continues to render the existing QR payload for wallet display and resale flow; it is **not** replaced by Admit 's `<TicketCard>`. Admit 's `<TicketCard>` is used only for the issued-ticket PNG render at purchase time |
| IR-09 | Admit  ↔ SSR Express server | All Admit  components dynamically imported with `React.lazy` + `Suspense`; guarded by `typeof window !== 'undefined'`; server render emits a loading skeleton |

---

## L2.3 Deliverables & Exit Gate

| Deliverable | Owner | Format |
|---|---|---|
| Functional Requirements register (FR-ST, FR-AD, FR-SC) with codebase file references | LD + QA | This document |
| Interface Requirements register (IR-01 – IR-09) | LD + BE | This document |
| Traceability matrix L1 → L2 | QA | Spreadsheet |
| SRS review sign-off | PO + LD + QA + BE | Meeting minutes |

**Exit gate:** Every user story maps to at least one FR. All NFRs have measurable pass criteria. BE has reviewed and agreed to all IR entries touching Supabase. SRS signed off.

---
---

# L3 — Architecture & System Design

> **Mirror:** L3′ Integration Testing

## Purpose

Define the structural integration of Admit  into ReactTicketing — how the module connects to the existing platform, what database changes are required, and how the security model bridges Admit 's design with Supabase's RLS/RPC architecture.

---

## L3.1 System Context Diagram

```
  ┌──────────────────────────────────────────────────────────────────────┐
  │                     Browser / Capacitor Web View                      │
  │                                                                        │
  │  ┌──────────────────────────────────────────────────────────────────┐ │
  │  │               ReactTicketing /platform (React 19 + SSR)          │ │
  │  │                                                                    │ │
  │  │  EventDetails.tsx          ManageEvent.tsx      /scan/:eventId    │ │
  │  │  ┌─────────────────┐     ┌────────────────┐    ┌───────────────┐  │ │
  │  │  │<Admit      │     │<Admit     │    │<Admit    │  │ │
  │  │  │ mode="store-    │     │ mode="admin"   │    │ mode="scanner"│  │ │
  │  │  │ front">         │     │ (org session   │    │>              │  │ │
  │  │  │                 │     │  gated)        │    │               │  │ │
  │  │  └────────┬────────┘     └───────┬────────┘    └──────┬────────┘  │ │
  │  │           │                      │                     │           │ │
  │  │           └──────────────────────┼─────────────────────┘           │ │
  │  │                                  │ SupabaseAdapter                  │ │
  │  └──────────────────────────────────┼──────────────────────────────────┘ │
  │                                     │                                    │
  └─────────────────────────────────────┼────────────────────────────────────┘
                                        │ @supabase/supabase-js (existing dep)
                    ┌───────────────────▼────────────────────┐
                    │              Supabase                    │
                    │  PostgreSQL + RLS + RPC + Auth + Vault  │
                    │                                          │
                    │  Tables (existing):                      │
                    │    events, ticket_types, tickets,        │
                    │    orders, scan_accounts, scan_events,   │
                    │    organizer_profiles, user_roles,       │
                    │    resale_listings                       │
                    │                                          │
                    │  Tables (new migration):                 │
                    │    promo_codes                           │
                    │                                          │
                    │  Schema deltas (existing tables):        │
                    │    scan_accounts: +credential_version,   │
                    │      +assigned_location, +last_login_at  │
                    │    scan_events: +clock_skew_seconds,     │
                    │      +scanned_by_account_name            │
                    │    tickets: +tf_qr_payload (if legacy    │
                    │      qr_payload column type conflicts)   │
                    │                                          │
                    │  RPCs (new):                             │
                    │    validate_ticket (SECURITY DEFINER)    │
                    │    increment_promo_usage (SECURITY DEF.) │
                    │                                          │
                    │  Vault:                                  │
                    │    scan_session_secret_<eventId>         │
                    └──────────────────────────────────────────┘
```

---

## L3.2 SupabaseAdapter — Full Specification

The `SupabaseAdapter` is the most critical net-new piece of the integration. It implements Admit 's `StorageAdapter` interface using the existing `@supabase/supabase-js` client already present in `/platform`.

```typescript
// platform/src/lib/Admit /SupabaseAdapter.ts

import { createClient, SupabaseClient } from "@supabase/supabase-js"; // already in /platform
import type { StorageAdapter, /* ... all TF types */ } from "Admit ";

export class SupabaseAdapter implements StorageAdapter {
  readonly name = "SupabaseAdapter";

  constructor(private supabase: SupabaseClient) {}

  // ── Ticket Types ──────────────────────────────────────────────
  async getTicketTypes(eventId: string): Promise<TicketTypeConfig[]> {
    const { data } = await this.supabase
      .from("ticket_types")
      .select("*")
      .eq("event_id", eventId);
    return data?.map(mapDbRowToTicketTypeConfig) ?? [];
  }

  async saveTicketType(eventId: string, type: TicketTypeConfig): Promise<void> {
    await this.supabase.from("ticket_types").upsert(mapTicketTypeConfigToRow(eventId, type));
  }

  // ── Orders ────────────────────────────────────────────────────
  async createOrder(order: Order): Promise<void> {
    await this.supabase.from("orders").insert(mapOrderToRow(order));
  }

  // ── Tickets ───────────────────────────────────────────────────
  async saveTicket(ticket: IssuedTicket): Promise<void> {
    // TEXT PK: id must be pre-generated via crypto.randomUUID() by TicketService
    await this.supabase.from("tickets").insert(mapTicketToRow(ticket));
  }

  async countIssuedTickets(ticketTypeId: string): Promise<number> {
    const { count } = await this.supabase
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("ticket_type_id", ticketTypeId)
      .neq("status", "cancelled");
    return count ?? 0;
  }

  // ── Promo Codes ───────────────────────────────────────────────
  async incrementPromoUsage(code: string): Promise<void> {
    // Calls the SECURITY DEFINER RPC — atomic check + increment
    const { error } = await this.supabase.rpc("increment_promo_usage", { p_code: code });
    if (error) throw new Error(error.message);
  }

  // ── Scan Accounts ─────────────────────────────────────────────
  async getScanAccountByUsername(eventId: string, username: string): Promise<ScanAccount | null> {
    const { data } = await this.supabase
      .from("scan_accounts")
      .select("*")
      .eq("event_id", eventId)
      .eq("username", username)
      .single();
    return data ? mapDbRowToScanAccount(data) : null;
  }

  async saveScanAccount(account: ScanAccount): Promise<void> {
    // pinHash and pinSalt are written here; plain PIN never reaches this method
    await this.supabase.from("scan_accounts").upsert(mapScanAccountToRow(account));
  }

  async updateScanAccount(accountId: string, patch: Partial<ScanAccount>): Promise<void> {
    await this.supabase.from("scan_accounts").update(mapScanAccountPatchToRow(patch)).eq("id", accountId);
  }

  // ── Scan Events ───────────────────────────────────────────────
  async saveScanEvent(scan: ScanEvent): Promise<void> {
    // Delegates to validate_ticket RPC for admission events to enforce
    // the unique-admit constraint. Direct insert for non-admit log events.
    if (scan.result === "admitted" || scan.result === "clock_skew_anomaly") {
      const { data, error } = await this.supabase.rpc("validate_ticket", {
        p_ticket_id:          scan.ticketId,
        p_scan_account_id:    scan.scannedByAccountId,
        p_session_token:      scan.sessionToken,  // passed through for server-side verification
        p_scanned_at:         scan.scannedAt.toISOString(),
      });
      if (error) throw new Error(error.message);
      return;
    }
    await this.supabase.from("scan_events").insert(mapScanEventToRow(scan));
  }

  // ... all remaining StorageAdapter methods
}
```

**Mapping functions** (`mapDbRowToTicketTypeConfig`, etc.) live in `platform/src/lib/Admit /mappers.ts` and handle the schema differences between Supabase's snake_case columns and Admit 's camelCase types.

---

## L3.3 Database Migration Plan

All migrations follow the existing convention in `/supabase/migrations/` — numbered, sequential, reversible.

### Migration 001 — `promo_codes` table (net-new)

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_create_promo_codes.sql

CREATE TABLE promo_codes (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id      TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  code          TEXT NOT NULL,
  discount_kind TEXT NOT NULL CHECK (discount_kind IN ('percent_off','amount_off','free')),
  discount_value INTEGER,               -- null for 'free'
  applies_to    TEXT[],                 -- null = all ticket types
  max_uses      INTEGER,               -- null = unlimited
  used_count    INTEGER NOT NULL DEFAULT 0,
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  batch_id      UUID,
  CONSTRAINT promo_codes_event_code_unique UNIQUE (event_id, code)
);

-- RLS
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

-- Organizers can read/write their own event's codes
CREATE POLICY "organizer_manage_promo_codes" ON promo_codes
  FOR ALL USING (
    event_id IN (
      SELECT e.id FROM events e
      JOIN organizer_profiles op ON op.id = e.organizer_id
      WHERE op.user_id = auth.uid()
    )
  );

-- Buyers can read active codes (for storefront validation display only)
-- Full validation is done server-side via RPC
CREATE POLICY "public_read_active_promo_codes" ON promo_codes
  FOR SELECT USING (active = TRUE);
```

### Migration 002 — `scan_accounts` schema delta

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_alter_scan_accounts_add_columns.sql

-- Check before altering: if these columns already exist in the live schema, skip.
ALTER TABLE scan_accounts
  ADD COLUMN IF NOT EXISTS credential_version  INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS assigned_location   TEXT,
  ADD COLUMN IF NOT EXISTS last_login_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pin_salt            TEXT,    -- was PIN stored differently? audit first
  ADD COLUMN IF NOT EXISTS created_by_admin    BOOLEAN NOT NULL DEFAULT TRUE;

-- Existing rows: set credential_version = 1 where null
UPDATE scan_accounts SET credential_version = 1 WHERE credential_version IS NULL;
```

> ⚠️ **Pre-migration audit required:** Before running Migration 002, the BE must inspect the live `scan_accounts` schema to determine how PIN data is currently stored. If the existing column is named differently or stores a bcrypt hash instead of PBKDF2, a data migration or dual-hash transition period is needed. This audit is a Sprint 1 deliverable.

### Migration 003 — `scan_events` schema delta

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_alter_scan_events_add_columns.sql

ALTER TABLE scan_events
  ADD COLUMN IF NOT EXISTS clock_skew_seconds       INTEGER,
  ADD COLUMN IF NOT EXISTS scanned_by_account_name  TEXT,  -- denormalised at write time
  ADD COLUMN IF NOT EXISTS result                   TEXT
    CHECK (result IN (
      'admitted','already_used','invalid','expired','cancelled','clock_skew_anomaly'
    ));

-- If 'result' column exists with different constraints, adapt accordingly
```

### Migration 004 — `validate_ticket` RPC (SECURITY DEFINER)

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_create_validate_ticket_rpc.sql

CREATE OR REPLACE FUNCTION validate_ticket(
  p_ticket_id       TEXT,
  p_scan_account_id UUID,
  p_session_token   TEXT,
  p_scanned_at      TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ticket          tickets%ROWTYPE;
  v_scan_account    scan_accounts%ROWTYPE;
  v_session_secret  TEXT;
  v_clock_skew_secs INTEGER;
  v_result          TEXT;
BEGIN
  -- 1. Fetch and verify scan account is active
  SELECT * INTO v_scan_account FROM scan_accounts WHERE id = p_scan_account_id;
  IF NOT FOUND OR v_scan_account.active = FALSE THEN
    RETURN jsonb_build_object('result', 'invalid', 'reason', 'account_inactive');
  END IF;

  -- 2. Verify session token HMAC + credential_version
  --    (Token verification logic calls pg_crypto / Vault; simplified here)
  v_session_secret := vault.get_secret('scan_session_secret_' || v_scan_account.event_id);
  IF NOT verify_scan_token(p_session_token, v_session_secret, v_scan_account.credential_version) THEN
    RETURN jsonb_build_object('result', 'invalid', 'reason', 'invalid_token');
  END IF;

  -- 3. Fetch ticket
  SELECT * INTO v_ticket FROM tickets WHERE id = p_ticket_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('result', 'invalid', 'reason', 'ticket_not_found');
  END IF;

  -- 4. Check ticket status
  IF v_ticket.status = 'used' THEN
    RETURN jsonb_build_object('result', 'already_used');
  END IF;
  IF v_ticket.status = 'cancelled' THEN
    RETURN jsonb_build_object('result', 'cancelled');
  END IF;

  -- 5. Clock skew check
  v_clock_skew_secs := EXTRACT(EPOCH FROM (NOW() - p_scanned_at))::INTEGER;
  IF ABS(v_clock_skew_secs) > 3600 THEN
    RETURN jsonb_build_object('result', 'invalid', 'reason', 'clock_skew_extreme');
  END IF;

  -- 6. Atomic admit with unique constraint (INSERT will fail if already admitted)
  BEGIN
    INSERT INTO scan_events (
      ticket_id, scanned_by_account_id, scanned_by_account_name,
      scanned_at, result, clock_skew_seconds, location
    ) VALUES (
      p_ticket_id, p_scan_account_id, v_scan_account.username,
      p_scanned_at,
      CASE WHEN ABS(v_clock_skew_secs) > 300 THEN 'clock_skew_anomaly' ELSE 'admitted' END,
      CASE WHEN ABS(v_clock_skew_secs) > 300 THEN v_clock_skew_secs ELSE NULL END,
      v_scan_account.assigned_location
    );
    UPDATE tickets SET status = 'used' WHERE id = p_ticket_id;
  EXCEPTION WHEN unique_violation THEN
    RETURN jsonb_build_object('result', 'already_used');
  END;

  RETURN jsonb_build_object(
    'result', CASE WHEN ABS(v_clock_skew_secs) > 300 THEN 'clock_skew_anomaly' ELSE 'admitted' END,
    'clock_skew_seconds', v_clock_skew_secs
  );
END;
$$;

-- CRITICAL: Follow the existing REVOKE pattern from buy_resale_ticket
REVOKE EXECUTE ON FUNCTION validate_ticket FROM public;
REVOKE EXECUTE ON FUNCTION validate_ticket FROM anon;
GRANT EXECUTE ON FUNCTION validate_ticket TO authenticated;
```

### Migration 005 — `increment_promo_usage` RPC (SECURITY DEFINER)

```sql
CREATE OR REPLACE FUNCTION increment_promo_usage(p_code TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE promo_codes
  SET used_count = used_count + 1
  WHERE code = p_code
    AND active = TRUE
    AND (max_uses IS NULL OR used_count < max_uses)
    AND (expires_at IS NULL OR expires_at > NOW());

  IF NOT FOUND THEN
    RAISE EXCEPTION 'promo_code_exhausted_or_invalid';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION increment_promo_usage FROM public;
REVOKE EXECUTE ON FUNCTION increment_promo_usage FROM anon;
GRANT EXECUTE ON FUNCTION increment_promo_usage TO authenticated;
```

---

## L3.4 Architecture Decision Records

| ID | Decision | Rationale |
|---|---|---|
| AD-01 | **Admin gate = Supabase organizer session, not bcrypt `adminKey`** | ReactTicketing already has a battle-tested auth system in `user_roles`. Adding a parallel bcrypt passphrase creates a second credential surface. Admit 's `adminKey` prop is left unused in ReactTicketing; the `<Admit  mode="admin">` mount site wraps it in a guard that checks `useOrganizer()` from the existing platform hooks. |
| AD-02 | **Admit  `<ScannerView>` replaces the Capacitor scanner web view** | The existing Capacitor app (`/mobile-scanner`) wraps a web view. Admit 's `<ScannerView>` becomes that web view content, replacing whatever page currently lives at the `/scan` route. The Capacitor shell (native wrapper, push notifications if any, App Store distribution) is kept intact. This is an in-place upgrade, not a parallel deployment. |
| AD-03 | **`scanSessionSecret` stored in Supabase Vault, not in `events` table** | The `events` table is readable by buyers (to fetch event details for the storefront). Storing a signing secret there would expose it to anyone with a valid Supabase session. Vault is the correct Supabase primitive for secrets; the `validate_ticket` RPC fetches it server-side via `vault.get_secret()`. |
| AD-04 | **`SupabaseAdapter` lives in `/platform`, not in the Admit  package** | Admit  has zero runtime deps. `@supabase/supabase-js` belongs to ReactTicketing. The adapter is a thin bridge layer in `platform/src/lib/Admit /`. This keeps the Admit  package portable. |
| AD-05 | **SSR: all Admit  components dynamically imported with `React.lazy`** | Admit  uses Canvas API and `crypto.subtle` — both are `undefined` in Node.js (Express SSR). Dynamic import with `typeof window !== 'undefined'` guards prevents the SSR pass from crashing. The server emits a loading skeleton; the client hydrates with the real component. |
| AD-06 | **Existing `<TicketCard>` in `Wallet.tsx` is NOT replaced** | The fan wallet and resale flow use the existing `<TicketCard>` component. Admit 's `<TicketCard>` is used exclusively to render the issued-ticket PNG at purchase time (for download and email). Two separate card components for two separate contexts avoids the risk of breaking the wallet + resale flow. |
| AD-07 | **TEXT PK pattern: `crypto.randomUUID()` in `SupabaseAdapter.saveTicket()`** | The `events` and `tickets` tables use TEXT PKs without a Postgres default generator (§4.1 of codebase doc). Admit 's `TicketService` generates the UUID and passes it through `StorageAdapter.saveTicket()`. The `SupabaseAdapter` asserts `ticket.id` is set and throws if it is not. This mirrors the existing pattern in `CreateEvent.tsx`. |
| AD-08 | **`validate_ticket` RPC for all admission writes; direct insert for non-admissions** | Only `admitted` and `clock_skew_anomaly` results need the unique-admit constraint enforced atomically. Non-admission events (`invalid`, `already_used`, `expired`, `cancelled`) can be logged directly to `scan_events` without the RPC overhead, as they do not mutate `tickets.status`. |

---

## L3.5 SSR Dynamic Import Pattern

```tsx
// platform/src/pages/marketplace/EventDetails.tsx (existing file — additions only)

import React, { Suspense } from "react";
import { useEvent } from "../../hooks/useEvent";
import { useSupabase } from "../../hooks/useSupabase"; // existing
import { mapEventToAdmit Config } from "../../lib/Admit /mappers";
import { SupabaseAdapter } from "../../lib/Admit /SupabaseAdapter";

// Dynamic import — never runs on the SSR Express server
const Admit  = React.lazy(() =>
  typeof window !== "undefined"
    ? import("Admit ").then(m => ({ default: m.Admit  }))
    : Promise.resolve({ default: () => null })
);

export default function EventDetails() {
  const { event } = useEvent();
  const supabase = useSupabase();
  const adapter  = React.useMemo(() => new SupabaseAdapter(supabase), [supabase]);
  const tfEvent  = React.useMemo(() => mapEventToAdmit Config(event), [event]);

  // External events bypass Admit  entirely — existing rule preserved (FR-ST-03)
  if (event?.is_external) return <ExternalEventButton url={event.external_ticket_url} />;

  return (
    <>
      {/* All existing EventDetails UI — unchanged */}
      <EventHero event={event} />
      <LineupSection event={event} />

      {/* Admit  storefront — SSR emits skeleton; client hydrates */}
      <Suspense fallback={<TicketStorefrontSkeleton />}>
        <Admit 
          event={tfEvent}
          adapter={adapter}
          mode="storefront"
          theme={event?.theme_customization ?? undefined}
          onCheckout={order => openCheckoutModal(order)}
          onTicketIssued={(ticket, { cardPngBlob }) => sendTicketEmail(ticket, cardPngBlob)}
        />
      </Suspense>
    </>
  );
}
```

---

## L3.6 QR Payload Alignment

The existing `tickets.qr_payload` column stores some payload string. Admit  generates `TF1.<eventId>.<ticketId>.<hmac>`. Before running Migration 003:

1. **Audit** the current format of `qr_payload` in the live database.
2. If the existing format differs, new Admit -issued tickets will have `TF1.*` payloads; existing legacy tickets will have the old format.
3. The `validate_ticket` RPC must handle both formats during a transition period — it should attempt TF1 parse first, then fall back to the legacy verification path.
4. Legacy tickets scanned after integration must still be admitted correctly.
5. This transition audit is a Sprint 1 deliverable; the fallback path is a Sprint 2 implementation task.

---

## L3.7 Deliverables & Exit Gate

| Deliverable | Owner | Format |
|---|---|---|
| System context diagram | LD | This document |
| `SupabaseAdapter` full specification with method signatures | LD | This document |
| Database migration scripts (001–005) reviewed by BE + SEC | BE | `/supabase/migrations/` |
| Architecture Decision Records (AD-01 – AD-08) | LD | This document |
| `scan_accounts` pre-migration audit | BE | Written report |
| QR payload format audit and transition plan | BE + LD | Written report |
| L3′ Integration Test Plan (derived from INT register below) | QA | Separate doc |
| Supabase Vault provisioning plan for `scan_session_secret` | BE + SEC | Runbook |

**Exit gate:** All migrations reviewed by BE + SEC. REVOKE pattern confirmed on all new RPCs. Vault plan agreed. AD-08 (dual QR format transition) plan written. Integration test plan signed off by QA.

---
---

# L4 — Module & Component Design

> **Mirror:** L4′ Unit Testing

## Purpose

Define the internal contract of each Admit  service, hook, and component, plus specify what existing ReactTicketing files are modified and what is left untouched.

---

## L4.1 Files Modified in `/platform` (additions only — no removals)

| File | Type of change | Risk |
|---|---|---|
| `platform/src/pages/marketplace/EventDetails.tsx` | Add `<Admit  mode="storefront">` inside `<Suspense>`; add dynamic import | Low — additive |
| `platform/src/pages/organizer/ManageEvent.tsx` | Add `<Admit  mode="admin">` tab in the existing tabbed UI; add dynamic import | Low — additive |
| `platform/src/router.tsx` (or equivalent) | Add `/scan/:eventId` route pointing to a new `ScanPage.tsx` | Low — new route |
| `platform/src/lib/Admit /SupabaseAdapter.ts` | **New file** | — |
| `platform/src/lib/Admit /mappers.ts` | **New file** | — |
| `platform/src/pages/scanner/ScanPage.tsx` | **New file** — mounts `<Admit  mode="scanner">` | — |
| `mobile-scanner/` web view target | Update to point to `/scan/:eventId` instead of current scanner page | Low — URL change |

**Files that must NOT be modified:**
- `CheckoutModal.tsx` — wrapped by `onCheckout` callback, not edited
- `TicketCard.tsx` (Wallet) — left intact for wallet + resale display
- `buy_resale_ticket` RPC — never touched
- Any existing RLS policy — only additive new policies
- `ResaleMarket.tsx`, `Wallet.tsx` — no changes

---

## L4.2 Service Specifications (ReactTicketing-specific details)

### `SupabaseAdapter.saveTicket()`

**Pre-condition:** `ticket.id` must be set to a UUID string by `TicketService` before this method is called.  
**Assertion:** `if (!ticket.id) throw new Error("Admit : ticket.id must be set before saveTicket()")`.  
**Column mapping:** `ticket.qrPayload` → `tickets.qr_payload` (existing column); `ticket.status` → `tickets.status`; `ticket.buyerEmail` → lookup `auth.users.email` for `owner_id`.

### `AuthService` — ReactTicketing context

The `scanSessionSecret` is **not available** in the browser in ReactTicketing. The `SupabaseAdapter.saveScanEvent()` method passes the raw session token to the `validate_ticket` RPC, which performs HMAC verification server-side using the Vault secret. The client-side `AuthService` still validates expiry and `credentialVersion` from the token payload (which requires no secret) — this is a defence-in-depth check before the RPC call.

### `ScanAccountService` — PIN hash transition

If the existing `scan_accounts` table stores PINs as bcrypt hashes (common in existing systems), the service must:
1. Detect existing hash format on login (bcrypt `$2b$` prefix vs PBKDF2 base64 format).
2. Support bcrypt comparison for legacy accounts.
3. Migrate to PBKDF2 on first successful login (rehash and update the row).
4. After the migration window (configurable), reject bcrypt-hashed accounts.

This transition logic lives in `ScanAccountService.loginLegacyAccount()` and is removed in v1.1.

---

## L4.3 Component Specifications

### `<ScanPage>` (new file in `/platform`)

```tsx
// platform/src/pages/scanner/ScanPage.tsx
import React, { Suspense } from "react";
import { useParams } from "react-router-dom"; // existing dep in /platform
import { useSupabase } from "../../hooks/useSupabase";
import { useEventById } from "../../hooks/useEvent";
import { SupabaseAdapter } from "../../lib/Admit /SupabaseAdapter";
import { mapEventToAdmit Config } from "../../lib/Admit /mappers";

const Admit  = React.lazy(() =>
  import("Admit ").then(m => ({ default: m.Admit  }))
);

export default function ScanPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const supabase = useSupabase();
  const { event, loading } = useEventById(eventId!);
  const adapter = React.useMemo(() => new SupabaseAdapter(supabase), [supabase]);

  if (loading) return <FullScreenSpinner />;
  if (!event)  return <FullScreenError message="Event not found" />;

  return (
    <Suspense fallback={<FullScreenSpinner />}>
      <Admit 
        event={mapEventToAdmit Config(event)}
        adapter={adapter}
        mode="scanner"
        onCheckout={() => Promise.resolve("cancelled")} // unused
        onScanEvent={(scan) => {
          if (scan.result === "clock_skew_anomaly")
            console.warn("[Admit ] clock skew detected", scan.clockSkewSeconds);
        }}
      />
    </Suspense>
  );
}
```

---

## L4.4 Unit Test Plan (authored before implementation)

Tests are written in **Vitest** (existing test runner in ReactTicketing).

### SupabaseAdapter Tests

| Test ID | Scenario | Expected |
|---|---|---|
| UT-SA-01 | `saveTicket` — `ticket.id` not set | Throws assertion error before Supabase call |
| UT-SA-02 | `saveTicket` — valid ticket | Supabase mock receives correct row shape with snake_case columns |
| UT-SA-03 | `getTicketTypes` — RLS rejects (no session) | Error propagated to UI error state; no crash |
| UT-SA-04 | `saveScanEvent` with `result: "admitted"` | Calls `validate_ticket` RPC, NOT direct `scan_events` insert |
| UT-SA-05 | `saveScanEvent` with `result: "invalid"` | Direct `scan_events` insert; RPC not called |
| UT-SA-06 | `incrementPromoUsage` — exhausted code | `increment_promo_usage` RPC throws; error propagated |
| UT-SA-07 | `getScanAccountByUsername` — unknown user | Returns `null`; no error thrown |
| UT-SA-08 | `countIssuedTickets` — cancelled tickets excluded | SQL query includes `.neq("status", "cancelled")` |

### AuthService Tests (ReactTicketing context)

| Test ID | Scenario | Expected |
|---|---|---|
| UT-AUTH-01 | Valid token, account active, credentialVersion matches | Returns `ScanSession` |
| UT-AUTH-02 | Token credentialVersion mismatch | Throws `AuthorisationError` with `reason: "credential_reset"` |
| UT-AUTH-03 | Account `active: false` | Throws `AuthorisationError` with `reason: "account_inactive"` |
| UT-AUTH-04 | Token TTL expired | Throws `AuthorisationError` with `reason: "expired"` |
| UT-AUTH-05 | `assertScanSession(null)` | Throws `AuthorisationError` |
| UT-AUTH-06 | Unknown username login attempt | PBKDF2 still runs; `AuthError` returned; same timing as failed known-user |

### ScanAccountService Tests

| Test ID | Scenario | Expected |
|---|---|---|
| UT-ACC-01 | `createAccount` — Uint8Array zeroed post-derive | Buffer all-zero after call |
| UT-ACC-02 | `resetPin` — credentialVersion incremented | Adapter `updateScanAccount` called with `credentialVersion + 1` |
| UT-ACC-03 | Legacy bcrypt PIN login | `loginLegacyAccount` path taken; rehash to PBKDF2 on success |
| UT-ACC-04 | `deactivate` | `active: false` written; existing session rejected at next `verifyScanSession` |

### Migration Tests (Vitest + Supabase local dev)

| Test ID | Scenario | Expected |
|---|---|---|
| UT-MIG-01 | Run all 5 migrations on a clean local Supabase instance | All migrations succeed; no column conflicts |
| UT-MIG-02 | `validate_ticket` RPC called as `anon` role | `permission denied` error (REVOKE confirmed) |
| UT-MIG-03 | `validate_ticket` RPC — two concurrent calls for same ticket | Second call returns `already_used`; unique constraint enforced |
| UT-MIG-04 | `increment_promo_usage` on exhausted code | RPC raises exception |
| UT-MIG-05 | `scan_accounts` schema delta applied to table with existing rows | Existing rows have `credential_version = 1`; no null violations |

### SSR Guard Tests

| Test ID | Scenario | Expected |
|---|---|---|
| UT-SSR-01 | `EventDetails.tsx` rendered in Node.js (SSR pass) | No Canvas / crypto errors; `<TicketStorefrontSkeleton>` rendered |
| UT-SSR-02 | `ScanPage.tsx` rendered in Node.js | No errors; fallback spinner rendered |
| UT-SSR-03 | Client hydration after SSR | `<Admit >` mounts and replaces skeleton; no hydration mismatch warning |

---

## L4.5 Deliverables & Exit Gate

| Deliverable | Owner | Format |
|---|---|---|
| File modification register (modified vs. untouched) | LD | This document |
| `SupabaseAdapter` full method signatures + mapping notes | LD | This document |
| `ScanPage.tsx` component spec | FE | This document |
| PIN hash transition plan (`loginLegacyAccount`) | BE + FE | Written spec |
| Full unit test plan (UT-SA, UT-AUTH, UT-ACC, UT-MIG, UT-SSR) — tests written pre-implementation | QA | Vitest files |
| Component wireframes for scanner login + scan result on mobile | FE | Figma |

**Exit gate:** All unit tests exist and are failing (expected — implementation not yet started). File modification register approved by LD. PIN hash transition plan signed off by SEC. SSR guard approach approved by LD.

---
---

# L5 — Implementation

> **Bottom of the V**

## Purpose

Produce working, reviewed, migration-tested code that satisfies all L4 specifications across 6 sprints.

---

## Sprint Structure

### Sprint 1 — Groundwork & Audits (Week 6)

**Goal:** Environment, audits, mapper foundations, CI config for migrations.

| Task | Owner | Exit criterion |
|---|---|---|
| Audit live `scan_accounts` schema: column names, PIN hash format, existing constraints | BE | Written report; feeds Migration 002 |
| Audit live `tickets.qr_payload` format; document legacy format | BE + LD | Written report; feeds L3.6 transition plan |
| Scaffold `platform/src/lib/Admit /` directory: `SupabaseAdapter.ts`, `mappers.ts` stubs | FE | TypeScript compiles; all method stubs return `Promise.reject()` |
| Write all mapper functions (`mapDbRowToTicketTypeConfig`, etc.) with bidirectional tests | FE | UT-SA-02 mapper shape test passing |
| Draft Migrations 001–003; review with BE + SEC; run on local Supabase | BE | UT-MIG-01, UT-MIG-05 passing locally |
| Provision `scan_session_secret_<eventId>` in Supabase Vault on staging | BE + SEC | Secret readable by `validate_ticket` test call |
| CI: add Supabase migration test step to existing Vitest pipeline | DO | Pipeline runs migrations on ephemeral Supabase instance |

---

### Sprint 2 — Auth Services & Scan Account CRUD (Week 7–8)

**Goal:** `AuthService`, `ScanAccountService`, `useScanAuth`, `useScanAccounts`. All UT-AUTH and UT-ACC tests passing.

| Task | Owner | Tests |
|---|---|---|
| `AuthService` — client-side token parse, expiry + credentialVersion check, `assertScanSession` | FE | UT-AUTH-01 – UT-AUTH-06 |
| `ScanAccountService` — PBKDF2 create, reset PIN, deactivate, legacy bcrypt transition | FE | UT-ACC-01 – UT-ACC-04 |
| `useScanAuth` hook with lockout logic and `sessionStorage` persistence | FE | Lockout counter; restore on reload |
| `useScanAccounts` admin CRUD hook | FE | Create/deactivate/reset round-trip via `SupabaseAdapter` |
| Migration 004: `validate_ticket` RPC draft | BE | UT-MIG-02, UT-MIG-03 passing |
| Migration 005: `increment_promo_usage` RPC | BE | UT-MIG-04 passing |

**Code review mandatory checks:**
- `assertScanSession()` is the first statement in `ScanService.validateTicket()` — reviewer sign-off required
- `Uint8Array.fill(0)` present after every PBKDF2 derivation
- All new RPCs have `REVOKE EXECUTE FROM public; REVOKE EXECUTE FROM anon;`

---

### Sprint 3 — SupabaseAdapter & Storefront Integration (Week 8–9)

**Goal:** Complete `SupabaseAdapter`, integrate Admit  storefront into `EventDetails.tsx`, verify no regression on existing flows.

| Task | Owner | Tests |
|---|---|---|
| Complete all `SupabaseAdapter` methods | FE | UT-SA-01 – UT-SA-08 |
| SSR dynamic import wrapper in `EventDetails.tsx` | FE | UT-SSR-01, UT-SSR-03 |
| `mapEventToAdmit Config` mapper; `theme_customization` → `ThemeConfig` | FE | Mapper round-trip test |
| `onCheckout` callback wrapping `CheckoutModal.tsx` | FE | RTL: checkout modal opens on button press; Admit  receives `"confirmed"` |
| `onTicketIssued` callback wiring to existing email handler | FE | Smoke test: ticket PNG blob arrives in callback |
| External event bypass test (FR-ST-03) | FE | RTL: `<Admit >` not rendered when `is_external = true` |
| `useCart` with `sessionStorage` sync | FE | UT-CART-01 – UT-CART-05 |
| Regression smoke test: existing marketplace flows | QA | All existing Playwright E2E tests still green |

---

### Sprint 4 — Scanner UI, Capacitor Integration (Week 9–10)

**Goal:** `<ScannerLogin>`, `<ScannerView>`, `<ScanResult>`, `<ScanAccountBadge>`. Capacitor web view updated.

| Task | Owner | Tests |
|---|---|---|
| `<ScannerLogin>` — Uint8Array PIN, lockout, session restore | FE | UT-AUTH-01 – UT-AUTH-06 RTL |
| `ScanService.validateTicket()` calling `SupabaseAdapter.saveScanEvent()` → `validate_ticket` RPC | FE | UT-SCAN-01 – UT-SCAN-07 |
| `<ScannerView>` — camera loop with `qrParser` injection; QR payload legacy fallback | FE | Mock camera; injected parser; legacy payload path |
| `<ScanResult>` — all result types including `clock_skew_anomaly`; haptic + audio; 4 s auto-dismiss | FE | RTL: all 6 result variants |
| `<ScanAccountBadge>` — one-tap logout | FE | RTL: logout stops camera, clears session |
| Session expiry overlay during active scan | FE | TTL mock → overlay; camera stopped |
| `<ScanPage.tsx>` — new route; SSR guard | FE | UT-SSR-02 |
| Capacitor `mobile-scanner` web view URL updated to `/scan/:eventId` | FE | Manual test: Capacitor app loads scanner |
| Capacitor vibration pass-through verified on real Android device | FE | Manual: admit → vibrate; reject → vibrate pattern |

---

### Sprint 5 — Admin Panel & Promo Codes (Week 10–11)

**Goal:** Admit  admin panel in `ManageEvent.tsx` with organizer session gate, promo code manager, analytics.

| Task | Owner | Tests |
|---|---|---|
| Organizer session gate (AD-01): wrap `<Admit  mode="admin">` with `useOrganizer()` check | FE | RTL: non-organizer session blocked; organizer session allowed |
| `<ScanAccountManager>` — full CRUD + PIN reset modal inside `ManageEvent.tsx` | FE | RTL: create, deactivate, reset, delete |
| `<PromoCodeManager>` — generate, bulk, CSV export | FE | RTL: generate codes; CSV download |
| `<CapacityOverview>` — live gauges from `countIssuedTickets` | FE | RTL: gauge reflects issued count |
| `<ScanDashboard>` — Canvas charts + clock skew anomaly panel; aggregates from `scan_events` | FE | RTL: data flows to chart props; anomaly row renders |
| `<TicketTypeEditor>` — existing `useTicketTiers.ts` wired through `SupabaseAdapter` | FE | Create/edit/archive round-trip; `useTicketTiers` hook still works independently |
| SSR dynamic import wrapper in `ManageEvent.tsx` | FE | UT-SSR (ManageEvent variant) |
| `theme_customization` JSONB → Admit  `theme` prop: Pro-tier event theme applied | FE | Visual test: custom color shows in Admit  components |

---

### Sprint 6 — Hardening, Migration Cutover, Regression (Week 11)

**Goal:** All unit tests passing, full regression suite green, staging deployment, QR payload transition logic in place.

| Task | Owner | Tests |
|---|---|---|
| QR payload legacy fallback path in `validate_ticket` RPC | BE | IT test: legacy QR ticket admitted after integration |
| `loginLegacyAccount` bcrypt → PBKDF2 rehash on first successful login | FE | UT-ACC-03 |
| Full Vitest unit test suite — 100% of UT-* passing | QA + FE | CI green |
| Bundle size check: Admit  core ≤ 45 kB minzipped | DO | `size-limit` in CI |
| Staging deployment of all 5 migrations | BE + DO | Migrations run without error on staging Supabase |
| Staging smoke tests: buy ticket → receive PNG → scan with Capacitor | QA | Manual + automated |
| Existing Playwright E2E suite run in full — zero regressions | QA | All existing tests green |

---

## L5 Code Quality Gates (applied to every PR)

| Gate | Tool | Threshold |
|---|---|---|
| TypeScript strict mode | `tsc --noEmit` | Zero errors |
| Linting | ESLint + `@typescript-eslint` | Zero warnings on changed files |
| Unit tests | Vitest | All UT-* passing; no regressions |
| Service coverage | Vitest coverage | ≥ 90% on `platform/src/lib/Admit /` |
| Migrations | Supabase local test | All 5 migrations idempotent on clean instance |
| Bundle size | `size-limit` | Admit  core ≤ 45 kB minzipped |
| REVOKE pattern | Code review checklist | All new RPCs have `REVOKE EXECUTE FROM public; REVOKE EXECUTE FROM anon;` |
| Auth invariant | Code review checklist | `assertScanSession` is statement 1 in `validateTicket` |
| Uint8Array zero | Code review checklist | `array.fill(0)` after every PBKDF2 call |
| No `tickets.owner_id` mutation | Code review checklist | `SupabaseAdapter` never writes `owner_id` — only `buy_resale_ticket` RPC may do this |
| No plain PIN in state | Code review checklist | No `pin: string` field in any React state, reducer, or component |

---
---

# L4′ — Unit Testing

> **Mirrors L4 — Module & Component Design**

## Execution Schedule

| Sprint | Tests executed | Owner |
|---|---|---|
| Sprint 2 | UT-AUTH-01 – UT-AUTH-06, UT-ACC-01 – UT-ACC-04, UT-MIG-01 – UT-MIG-05 | QA + FE + BE |
| Sprint 3 | UT-SA-01 – UT-SA-08, UT-SSR-01 – UT-SSR-03, UT-CART-01 – UT-CART-05 | QA + FE |
| Sprint 4 | UT-SCAN-01 – UT-SCAN-07, scanner component suite | QA + FE |
| Sprint 5 | Admin panel component suite, analytics data flow | QA + FE |
| Sprint 6 | Full regression — all UT-* suites | QA |

## L4′ Exit Gate

| Criterion | Target |
|---|---|
| All UT-* tests passing | 100% |
| Service + adapter line coverage | ≥ 90% |
| No S1 or S2 bugs open | 0 |
| REVOKE pattern confirmed via UT-MIG-02 | Passing |
| Unique-admit constraint confirmed via UT-MIG-03 | Passing |
| `Uint8Array` zeroing confirmed via UT-ACC-01 | Passing |
| Legacy QR payload path confirmed via UT-SCAN (legacy variant) | Passing |

**Exit gate signed by:** QA + LD + BE

---
---

# L3′ — Integration Testing

> **Mirrors L3 — Architecture & System Design**

## Integration Test Cases

### SupabaseAdapter ↔ Supabase

| ID | Boundary | Scenario | Expected |
|---|---|---|---|
| IT-01 | INT-02 | `SupabaseAdapter.getTicketTypes()` with valid organizer session | Returns mapped `TicketTypeConfig[]`; RLS passes |
| IT-02 | INT-02 | `SupabaseAdapter.getTicketTypes()` with fan session (anon) | Returns only visible types; RLS restricts hidden types |
| IT-03 | INT-02 | `SupabaseAdapter.saveTicket()` — ticket.id not pre-set | Throws assertion error; no Supabase call |
| IT-04 | INT-02 | `SupabaseAdapter.saveTicket()` — duplicate TEXT PK | Supabase unique violation surfaced to TicketService |
| IT-05 | INT-02 | `SupabaseAdapter.saveScanEvent()` with `result: "admitted"` | `validate_ticket` RPC called; `scan_events` row written; `tickets.status = "used"` |
| IT-06 | INT-07 | Two concurrent `validate_ticket` RPC calls for same ticket | Second returns `already_used`; `tickets.status` = `"used"` exactly once |
| IT-07 | INT-02 | `validate_ticket` called as `anon` role | `permission denied` — REVOKE confirmed |
| IT-08 | INT-02 | `increment_promo_usage` on exhausted code | Exception propagated to `PromoService`; cart shows error |
| IT-09 | INT-02 | `SupabaseAdapter.updateScanAccount()` — credential_version increment | Next `verifyScanSession` with old version throws |

### Scanner ↔ AuthService ↔ Supabase

| ID | Boundary | Scenario | Expected |
|---|---|---|---|
| IT-10 | INT-04 | `validateTicket()` called with no session in context | `AuthorisationError` thrown; adapter never called |
| IT-11 | INT-04 | Session expires mid-scan loop | Camera stopped; expiry overlay; no partial scan written |
| IT-12 | INT-06 | `validate_ticket` RPC — token HMAC invalid | RPC returns `invalid`; ticket untouched |
| IT-13 | INT-06 | Clock skew 400 s | `clock_skew_anomaly` written to `scan_events`; ticket admitted |
| IT-14 | INT-06 | Clock skew 3700 s | `invalid` returned; ticket not admitted |
| IT-15 | INT-04 | Admin resets PIN mid-shift; crew next scan | RPC rejects old token; expiry overlay shown |
| IT-16 | INT-04 | Admin deactivates account; crew next scan | `verifyScanSession` checks `active`; overlay shown |

### Capacitor Web View ↔ Scanner

| ID | Scenario | Expected |
|---|---|---|
| IT-17 | Capacitor app loads `/scan/:eventId` on Android | `<ScannerLogin>` renders; no SSR errors in native web view |
| IT-18 | Camera permission granted in Capacitor | Rear camera opens; QR frame decoding starts |
| IT-19 | `navigator.vibrate` called in Capacitor web view | Device vibrates (manual verification on real Android device) |
| IT-20 | Capacitor app refreshed within session TTL | Session restored from `sessionStorage`; no re-login required |

### SSR ↔ Client Hydration

| ID | Scenario | Expected |
|---|---|---|
| IT-21 | `EventDetails.tsx` SSR pass | Skeleton rendered; no Canvas / crypto errors in Node.js |
| IT-22 | Client hydration of `EventDetails.tsx` | `<Admit >` mounts; replaces skeleton; no React hydration warning |
| IT-23 | `ManageEvent.tsx` SSR pass | No Admit  Canvas errors server-side |

### Regression — Existing Platform Flows

| ID | Scenario | Expected |
|---|---|---|
| IT-REG-01 | Fan purchases a ticket via existing `CheckoutModal.tsx` flow | Order and ticket created; Wallet shows new ticket; no Admit  interference |
| IT-REG-02 | Fan lists a ticket for resale via `Wallet.tsx` | `resale_listings` created; `buy_resale_ticket` RPC unmodified and functional |
| IT-REG-03 | Fan purchases a resale ticket | `buy_resale_ticket` RPC transfers `owner_id`; Admit  adapter never touches `owner_id` |
| IT-REG-04 | External event page | `is_external = true` → Admit  not rendered; external URL button shown |
| IT-REG-05 | Admin promotes user via `promote_admin_by_email` RPC | Unmodified RPC still works; no new REVOKE/GRANT conflicts |
| IT-REG-06 | Organizer uploads event image | Supabase Storage `event_images` bucket unaffected |
| IT-REG-07 | Support desk — admin views support ticket thread | `support_tickets` RLS + support desk UI unaffected |

### Security Integration Tests

| ID | Scenario | Expected |
|---|---|---|
| IT-SEC-01 | Replay scan (admitted ticket scanned again) | `already_used`; no second admission |
| IT-SEC-02 | Forged QR (invalid HMAC) | `invalid`; adapter never called for ticket update |
| IT-SEC-03 | JS console call to `ScanService.validateTicket()` with no session | `AuthorisationError`; no DB write |
| IT-SEC-04 | `validate_ticket` RPC called with modified token payload | HMAC mismatch; `invalid` returned |
| IT-SEC-05 | `scan_session_secret` fetched from Supabase Vault client-side | Vault RLS blocks; secret not returned to browser |
| IT-SEC-06 | `buy_resale_ticket` called after Admit  integration | Executes identically; Admit  added no new GRANT |

## L3′ Exit Gate

| Criterion | Target |
|---|---|
| All IT-* tests passing | 100% |
| All IT-REG-* regression tests passing | 100% |
| All IT-SEC-* tests passing | 100% |
| No S1 or S2 bugs open | 0 |
| Concurrent double-scan uniqueness confirmed (IT-06) | Passing |
| REVOKE confirmed on `validate_ticket` and `increment_promo_usage` (IT-07) | Passing |
| Capacitor haptic test on real Android device signed off (IT-19) | Manual sign-off |

**Exit gate signed by:** QA + LD + BE + SEC

---
---

# L2′ — System Testing

> **Mirrors L2 — System Requirements Specification**

**Environment:** Staging Supabase instance with all 5 migrations applied; production-equivalent Capacitor build; BrowserStack for cross-browser; real mid-range Android (2022) for scanner performance.

## Functional Test Coverage

| FR | Test scenario | Pass criteria |
|---|---|---|
| FR-ST-01 | Browse ticket tiers on staging event page | All visible tiers shown; capacity live; locale-formatted price |
| FR-ST-03 | External event page | Admit  not rendered; external URL button works |
| FR-ST-04 | Apply valid / expired / exhausted promo code | Correct message per case; discount applied only for valid |
| FR-ST-05 | Full purchase flow | `CheckoutModal` opens; on confirm, tickets issued |
| FR-ST-06 | Issued ticket PNG | UUID TEXT PK confirmed; `TF1.*` QR payload; PNG renders |
| FR-ST-08 | Cart persistence | Refresh page → cart items and promo code restored |
| FR-ST-09 | Free order | `onCheckout` not called; tickets issued directly |
| FR-AD-01 | Admin panel gate | Non-organizer Supabase session → panel not shown |
| FR-AD-05 | Create scan account | Plain PIN not in Supabase response; `credential_version = 1` |
| FR-AD-06 | Deactivate account | Login rejected within 10 s of deactivation |
| FR-AD-07 | Reset PIN | Old session invalidated; new PIN works |
| FR-AD-08 | Analytics dashboard | All 8 metrics render; clock skew anomaly visible |
| FR-AD-09 | Pro-tier theme applied | Custom `colorPrimary` from `theme_customization` visible in Admit  components |
| FR-SC-01 | Scanner login gate | No session → `<ScannerLogin>` shown |
| FR-SC-02 | Login lockout | 5 failures → 30 s countdown |
| FR-SC-03 | Session restore | Reload within TTL → scanner view directly |
| FR-SC-04 | Camera scan | Rear camera opens; QR code decoded |
| FR-SC-05 | Admit flow | Valid ticket → `validate_ticket` RPC → `admitted`; ticket status `used` in DB |
| FR-SC-07 | All result types | `already_used`, `invalid`, `expired`, `cancelled`, `clock_skew_anomaly` each render correctly |
| FR-SC-10 | Session expiry | Overlay appears; camera stopped; login remounts |
| FR-SC-11 | Logout | One tap; session cleared; camera stopped |

## Non-Functional Test Coverage

| NF | Test method | Pass criteria |
|---|---|---|
| NF-01 | Lighthouse on staging EventDetails | First Interactive < 2 s throttled 4G |
| NF-02 | Stopwatch on real Android 2022 | QR scan-to-result < 1.5 s median (10 scans) |
| NF-03 | BrowserStack matrix | Chrome 124+, Safari 17+, Firefox 125+, iOS Safari 16+, Android Chrome 120+ |
| NF-04 | axe-core + manual keyboard | Zero WCAG AA violations storefront + admin; scanner AA Large Text |
| NF-05 | DevTools storage inspection at every stage | No PIN, no secret, no HMAC key in any browser storage |
| NF-06 | IT-SEC-03 replay | Console call throws `AuthorisationError` |
| NF-07 | Full Playwright E2E regression suite | All existing tests green; no existing routes broken |
| NF-08 | `npm list --prod` inside Admit  package | Only `react` + `react-dom`; `@supabase/supabase-js` not listed |
| NF-09 | Network tab on scanner page | Zero requests to third-party domains |
| NF-10 | Attempt `tickets.owner_id` write via `SupabaseAdapter` | RLS blocks; `buy_resale_ticket` remains sole ownership transfer path |
| NF-11 | New `tickets` INSERT without pre-set ID | `SupabaseAdapter` assertion throws before Supabase call; no null PK error |

## L2′ Exit Gate

| Criterion | Target |
|---|---|
| All FR system tests passing | 100% |
| All NF tests passing | 100% |
| No S1 or S2 bugs open | 0 |
| All S3 bugs triaged and assigned to v1.1 | Done |
| Security final sign-off | SEC |

**Exit gate signed by:** QA + LD + BE + SEC + PO

---
---

# L1′ — Acceptance Testing & Production Sign-off

> **Mirrors L1 — Stakeholder & Business Requirements**

## UAT Scenarios

**Participants:** PO, STK (event organizer), one real crew member  
**Environment:** Production Supabase; sandbox payment mode; real Capacitor build installed on crew member's Android phone  
**Duration:** 1 day (half-day scripted + half-day unscripted)

| ID | Story | Scenario | Performed by | Pass criteria |
|---|---|---|---|---|
| UAT-01 | US-B-01 – US-B-04 | Browse tiers; buy 2 GA + 1 VIP with 20% promo code; download PNG | PO | PNGs received; correct prices; QR visible |
| UAT-02 | US-B-06 | Open Wallet; list UAT-01 GA ticket for resale | PO | Resale listing created; ticket locked in wallet |
| UAT-03 | US-A-01 | Create a "Late Entry €5" tier in ManageEvent; verify storefront shows it | STK | Tier visible; purchasable |
| UAT-04 | US-A-02 | Generate 20 promo codes (free); export CSV; apply one at checkout | STK | All 20 in CSV; free checkout works |
| UAT-05 | US-A-03 | Create scanner account "Door-Crew" PIN 3847 in ManageEvent | STK | Account in list; plain PIN not shown after save |
| UAT-06 | US-S-01 – US-S-03 | Crew opens Capacitor app; logs in as Door-Crew; scans UAT-01 VIP ticket | Crew | Admitted; name shown; phone vibrates |
| UAT-07 | US-S-03 | Crew scans same VIP ticket again | Crew | "Already used" with first scan time |
| UAT-08 | US-A-04 | STK resets Door-Crew PIN mid-session; crew attempts next scan | STK + Crew | Crew gets expiry overlay; old PIN rejected; new PIN works |
| UAT-09 | US-S-04 | Crew denies camera permission in Capacitor; enters code manually | Crew | Manual entry works; ticket admitted |
| UAT-10 | US-A-05 | STK views analytics after UAT scans | STK | Counts, velocity, per-account breakdown visible; UAT-07 duplicate flagged |
| UAT-11 | US-A-06 | Pro-tier event with custom `theme_customization`; view ticket card | STK | Custom brand colour appears on issued PNG |
| UAT-12 | BG-07 | Navigate marketplace, wallet, resale market, support desk | PO | No layout shifts; no JS errors; all existing flows work |
| UAT-13 | BG-09 | Complete a resale purchase (`buy_resale_ticket` RPC) | PO | Ticket ownership transferred; Admit  has not broken the RPC |

---

## Production Deployment Checklist

| # | Item | Owner | Verified |
|---|---|---|---|
| 1 | All 5 database migrations applied to production Supabase in order | BE + DO | ☐ |
| 2 | `scan_session_secret_<eventId>` provisioned in production Supabase Vault; not in any environment variable exposed to browser | BE + SEC | ☐ |
| 3 | `validate_ticket` RPC has `REVOKE EXECUTE FROM public; REVOKE EXECUTE FROM anon;` confirmed on production | BE | ☐ |
| 4 | `increment_promo_usage` RPC has `REVOKE EXECUTE FROM public; REVOKE EXECUTE FROM anon;` confirmed | BE | ☐ |
| 5 | Unique constraint on `scan_events` for concurrent admit confirmed on production | BE | ☐ |
| 6 | Server-side rate limiting on Supabase Edge Function / API gateway for scan account login (10 req/min per IP) | BE + DO | ☐ |
| 7 | `process.env.NODE_ENV === "production"` set in Vite build; SSR guard active | DO | ☐ |
| 8 | `SupabaseAdapter` points to production Supabase URL and anon key; staging values removed | DO | ☐ |
| 9 | Capacitor app updated to point to production `/scan/:eventId` route; published to App Store / Play Store (or internal distribution) | FE + DO | ☐ |
| 10 | QR payload legacy transition: `validate_ticket` RPC handles both TF1 and legacy payload formats | BE | ☐ |
| 11 | Existing Playwright E2E suite run against production after deployment | QA | ☐ |
| 12 | Error monitoring (existing Sentry / equivalent) receiving events from Admit  components | DO | ☐ |
| 13 | STK has created all scan accounts for event crew; PINs distributed out-of-band | STK | ☐ |
| 14 | Smoke test: buy ticket → scan with Capacitor → admitted on production | QA + DO | ☐ |
| 15 | Rollback plan tested: feature flag or route-level toggle to disable Admit  mounts without reverting migrations | DO | ☐ |

---

## L1′ Exit Gate

| Criterion | Target |
|---|---|
| All 13 UAT scenarios passing | 100% |
| All 15 production deployment checklist items verified | 100% |
| No S1 or S2 bugs open | 0 |
| Stakeholder sign-off on UAT | STK signature |
| PO formal go-live approval | PO signature |

**Signed off by:** PO + STK + LD + QA + BE + SEC + DO

---
---

## Appendix A — Full Traceability Matrix

| Business Goal | User Stories | Functional Requirements | Unit Tests | Integration Tests | System Tests | UAT |
|---|---|---|---|---|---|---|
| BG-01 | US-B-01 – US-B-05 | FR-ST-01 – FR-ST-09 | UT-SA-*, UT-CART-* | IT-01 – IT-05 | FR-ST-* | UAT-01 |
| BG-02 | US-A-01 | FR-AD-02 | UT-SA-01 | IT-01, IT-02 | FR-AD-02 | UAT-03 |
| BG-03 | US-B-04, US-B-05 | FR-ST-06, FR-ST-07 | UT-SA-02, UT-MIG-03 | IT-05, IT-06 | FR-ST-06 | UAT-01 |
| BG-04 | US-S-01 – US-S-05 | FR-SC-01 – FR-SC-11 | UT-AUTH-*, UT-ACC-*, UT-SCAN-* | IT-10 – IT-20, IT-SEC-* | FR-SC-* | UAT-05 – UAT-09 |
| BG-05 | US-A-02 | FR-AD-03, FR-AD-04 | UT-MIG-04 | IT-08 | FR-AD-03, FR-AD-04 | UAT-04 |
| BG-06 | US-A-05 | FR-AD-08 | — | — | FR-AD-08 | UAT-10 |
| BG-07 | — | NF-07, IR-01 – IR-09 | UT-SSR-* | IT-REG-* | NF-07 | UAT-12 |
| BG-08 | — | NF-08 | — | — | NF-08 | — |
| BG-09 | US-B-06 | NF-10, IR-08 | UT-SA-03 | IT-REG-02, IT-REG-03, IT-SEC-06 | NF-10 | UAT-02, UAT-13 |
| BG-10 | US-A-06 | FR-AD-09 | Mapper test | — | FR-AD-09 | UAT-11 |

---

## Appendix B — Defect Severity Definitions

| Severity | Definition | Resolution SLA |
|---|---|---|
| S1 — Critical | Security breach; ticket double-admission; scanner admits without valid session; `owner_id` mutated outside `buy_resale_ticket`; REVOKE missing on new RPC | Immediate; blocks release |
| S2 — High | Feature non-functional: checkout fails, camera never starts, admin panel inaccessible, existing Playwright suite regression | Before next gate |
| S3 — Medium | Non-blocking UI error, incorrect display, minor performance degradation, missing edge case handling | Triaged for v1.1 |
| S4 — Low | Cosmetic, typo, minor layout issue | Backlog |

---

## Appendix C — Deferred Items (v1.1 and later)

| Item | Reason for deferral |
|---|---|
| Legacy bcrypt → PBKDF2 forced migration (remove `loginLegacyAccount`) | Transition window required; safe to run in v1.1 after all accounts have logged in once |
| Legacy QR payload format support removal | Transition window required; remove fallback once all pre-integration tickets are expired or used |
| Scan account shift windows (auto-expire outside assigned hours) | Requires Supabase scheduled function; not available in v1.0 scope |
| Apple Wallet / Google Wallet export | Separate API integration project |
| Multi-language i18n | No confirmed second language requirement |
| Waitlist for sold-out tiers | No waitlist UX spec yet |
| Session audit log in admin panel | Analytics dashboard covers operational need |

---

*Document maintained by the ReactTicketing + Admit  project team. Version-controlled in `/docs` of the monorepo. All gate sign-offs are recorded in the project's decision log.*