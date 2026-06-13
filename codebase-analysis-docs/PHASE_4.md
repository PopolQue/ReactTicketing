## 4. Nuances, Subtleties & Gotchas

### 4.1 Primary Key Data Type Inconsistencies
* **Gotcha:** The `events` and `tickets` tables use `TEXT` as their primary keys instead of Postgres `UUID` defaults.
* **Why this matters:** When inserting new events or tickets from the frontend, you **must manually generate a UUID string** (e.g., via `crypto.randomUUID()`). Failure to pass an ID will result in a Postgres constraint error, as no default value generator is set on those older tables. Newer tables like `resale_listings` correctly use `UUID DEFAULT gen_random_uuid()`.

### 4.2 Admin Role and RLS Recursion Avoidance
* **Gotcha:** The `user_roles` table dictates `role = 'admin'` or `role = 'superadmin'`.
* **Nuance:** Because RLS policies on standard tables (like `events`) need to check if the current user is an admin to grant read/write access, the `user_roles` table itself must be carefully crafted to avoid recursive queries. Any changes to `user_roles` RLS policies should be heavily tested.
* **Resolution:** Superadmin checks are now securely processed through the `private.is_superadmin()` SQL function, which is `SECURITY DEFINER` and hidden from the public RPC API, fully eliminating recursion while retaining platform security.

### 4.3 Security Definer RPCs
* **Nuance:** Functions like `promote_admin_by_email()`, `buy_resale_ticket()`, and trigger functions use `SECURITY DEFINER` so they can execute with elevated privileges (bypassing RLS).
* **Gotcha:** By default, Supabase exposes `SECURITY DEFINER` functions to the `anon` and `public` roles. The codebase explicitly runs `REVOKE EXECUTE ON FUNCTION... FROM public;` and `REVOKE EXECUTE ON FUNCTION... FROM anon;` in its migrations. **Always** include these revoke statements when creating new RPCs, or you risk severe privilege escalation vulnerabilities.
* **Search Path Safety:** Furthermore, you must always append `SET search_path = ''` to prevent malicious schema injection during the function's execution context.

### 4.4 Mobile Scanner Authentication
* **Design Decision:** The venue scanning app does **not** use Supabase Auth for door staff. Instead, it relies on a custom `scan_accounts` table linked to an `event_id`, using a simple username and PIN.
* **Rationale:** This allows organizers to rapidly provision disposable credentials for temporary door staff without requiring email verification, passwords, or polluting the global `auth.users` pool.

### 4.5 External Events Bypass
* **Hardcoded Rule:** If an event has `is_external: true`, the frontend entirely ignores any `ticket_types` fetched from the database. The ticketing UI is replaced with a single button linking to `external_ticket_url`.

### 4.6 Stripe vs. Mock Processing
* **Nuance:** The system dynamically selects its payment gateway based on environment variables. If `VITE_STRIPE_PUBLIC_KEY` is present, `CheckoutModal.tsx` mounts the official Stripe Elements. Otherwise, it gracefully degrades to `MockCheckoutForm.tsx` for local testing without failing.

---
*(End of Phase 4 - Nuances, Subtleties & Gotchas)*
