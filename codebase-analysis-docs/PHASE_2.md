
## 2. System Architecture Deep Dive

### 2.1 Data Flow and Interactions
ReactTicketing heavily utilizes a **BaaS (Backend-as-a-Service) architecture** pattern with Supabase as the core data and authentication layer. 

**Client-to-Database Flow:**
1. **Frontend (React/Vite):** Client-side components use the `@supabase/supabase-js` client to query the database directly. 
2. **Authentication:** Uses Supabase Auth (`auth.users`) to manage sessions. Role claims are stored in a custom `user_roles` table.
3. **Database Security (RLS):** Row Level Security policies enforce access constraints directly at the Postgres layer. E.g., Fans can only `SELECT` tickets where `owner_id = auth.uid()`. Organizers can only `UPDATE` events where `organizer_id = auth.uid()`.
4. **RPC Functions:** Complex operations that require transactionality or bypassing RLS (e.g., executing a secondary market ticket transfer from Seller to Buyer) are encapsulated in PostgreSQL Functions (`buy_resale_ticket`) exposed via RPC.

### 2.2 Core Database Entities
- `events` & `ticket_types`: The primary models for the primary market.
- `tickets`: The core asset, linked to an `owner_id`.
- `resale_listings`: Secondary market listings linking a ticket to a seller and an asking price.
- `orders`: Records of purchase intent and finalization.
- `organizer_profiles`: Organizer metadata and subscription tiers.
- `artists` & `event_artists`: Artist directory and lineup mappings.
- `blogs`: Markdown-powered community posts.
- `support_tickets` & `support_ticket_messages`: Customer support infrastructure.
- `scan_accounts` & `scan_events`: Credentials and logs for the physical ticket validation layer.

### 2.3 Cross-Cutting Concerns
* **Security:** 
    * "God-mode" or cross-tenant functions (e.g., `promote_admin_by_email` or `buy_resale_ticket`) use `SECURITY DEFINER` with explicit `REVOKE EXECUTE FROM PUBLIC/anon` to prevent unauthenticated execution.
    * Database RLS ensures that frontend queries do not need complex filtering logic to remain secure.
* **Storage:** Supabase Storage is used for event images (`event_images` bucket), protected by public read policies and restricted write policies.
* **Theming:** Handled via a JSONB column `theme_customization` on the `events` table, allowing dynamic CSS injection for Pro-tier organizers.

---
*(End of Phase 2 - System Architecture Deep Dive)*
