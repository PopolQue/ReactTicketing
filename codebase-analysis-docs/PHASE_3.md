## 3. Feature-by-Feature Analysis

### 3.1 Public Marketplace & Ticketing
* **Purpose:** Allows fans to discover events and purchase primary market tickets.
* **Technical Breakdown:**
  * **Entry Points:** `platform/src/pages/marketplace/Home.tsx` (Feed), `EventDetails.tsx` (Event Page).
  * **Models:** `events`, `ticket_types`, `orders`, `tickets`.
  * **Execution:** Users select a ticket tier via `<PrimaryTicketSelector />`. The `CheckoutModal.tsx` simulates payment and inserts an `order` and `ticket` record.
* **Edge Cases & Nuances:** External events (`is_external: true`) bypass the checkout modal entirely and direct users to an `external_ticket_url`.

### 3.2 Secondary Resale Market
* **Purpose:** Enables secure, fraud-free peer-to-peer ticket resales.
* **Technical Breakdown:**
  * **Entry Points:** `platform/src/pages/marketplace/ResaleMarket.tsx` (Global feed), `platform/src/pages/fan/Wallet.tsx` (Listing interface).
  * **Models:** `resale_listings`, `tickets`.
  * **Execution:** Fans list a ticket for a specific `asking_price_cents`. Buyers trigger the `buy_resale_ticket` RPC function. This function atomically verifies the listing, transfers the `owner_id` on the `tickets` table to the buyer, deletes the `resale_listings` record, and completes the transaction safely.
* **Interactions:** A listed ticket is "Locked" in the user's `<TicketCard />` in the Wallet to prevent them from scanning or transferring it while listed.

### 3.3 Organizer Dashboard & Event Management
* **Purpose:** Self-serve portal for promoters to create and manage events.
* **Technical Breakdown:**
  * **Entry Points:** `platform/src/pages/organizer/Dashboard.tsx`, `CreateEvent.tsx`, `ManageEvent.tsx`.
  * **Controllers/Hooks:** Domain logic is extracted into `src/hooks/` (e.g., `useEvent`, `useTicketTiers`) and `src/features/event-management/`.
  * **Execution:** Organizers upload images directly to Supabase Storage via `ImageUploader.tsx` (with client-side compression to WebP). Lineups are built by linking `artists` to `events` via `event_artists` junction table in `LineupManager.tsx`.
* **Edge Cases:** The events table uses `TEXT` for IDs (legacy decision), so `crypto.randomUUID()` is manually generated on the frontend during creation.

### 3.4 Scanning & Entry Validation
* **Purpose:** Physical access control at the venue doors.
* **Technical Breakdown:**
  * **Entry Points:** Web portal `ScanTickets.tsx` and Capacitor mobile app (`mobile-scanner`).
  * **Models:** `scan_accounts` (auth for scanners), `scan_events` (logs), `tickets`.
  * **Execution:** Organizers create dedicated "Scanner Accounts" (which are *not* Supabase Auth users, but rather pin-code based credentials stored in `scan_accounts`). The mobile app reads the `qr_payload` of a ticket, verifies it against the `tickets` table, and logs the entry in `scan_events`.

### 3.5 Admin, Superadmin, and Support Portals
* **Purpose:** Platform moderation, employee access, and customer support.
* **Technical Breakdown:**
  * **Entry Points:** `platform/src/pages/admin/SupportDesk.tsx`, `platform/src/pages/superadmin/AdminManagement.tsx`.
  * **Models:** `user_roles`, `support_tickets`, `support_ticket_messages`.
  * **Execution:** Superadmins can promote standard users to Admins using the `promote_admin_by_email` RPC. Admins view support threads in a split-pane view (`<TicketSidebar />` and `<TicketThreadView />`).

### 3.6 Artist Verification & Management (New Feature)
* **Purpose:** Allows artists to verify their identity and control their platform metadata.
* **Technical Breakdown:**
  * **Entry Points:** `platform/src/pages/artist/ArtistDashboard.tsx`, `platform/src/pages/admin/ArtistClaims.tsx`.
  * **Models:** `artists`, `artist_claims`.
  * **Execution:** A user claims an artist stub created by an organizer. An admin reviews the `proof_url` in the admin portal. Upon approval, the `artists.claimed_by_user_id` is linked to the user, and `is_verified` becomes true, permanently transferring edit permissions away from the organizer.

---
*(End of Phase 3 - Feature-by-Feature Analysis)*
