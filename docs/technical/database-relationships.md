# Database Schema Relationships

This document outlines the relationships between tables in the `public` schema.

## Core Entities

- **events**: Central entity.
  - Links to: `organizers`, `timezones`, `venues`.
  - Referenced by: `event_artists`, `event_checkout_fields`, `orders`, `page_views`, `promo_batches`, `promo_codes`, `scan_accounts`, `ticket_types`.
- **organizers**:
  - Referenced by: `artists` (via `created_by`), `events`, `page_views`.
- **artists**:
  - Referenced by: `artist_members`, `event_artists`.
- **venues**:
  - Referenced by: `events`.

## Tickets & Checkout

- **tickets**:
  - Links to: `events` (via `event_id`), `ticket_types` (via `ticket_type_id`), `orders` (via `order_id`).
  - Referenced by: `resale_listings`, `scan_events`.
- **ticket_types**:
  - Links to: `events`.
  - Referenced by: `tickets`.
- **orders**:
  - Links to: `events`.
  - Referenced by: `tickets`.
- **resale_listings**:
  - Links to: `tickets`, `users` (via `seller_id`, `offered_to_user_id`).

## Users & Authentication (via `auth.users`)

- **auth.users** (External table, references to it are listed below):
  - Referenced by: `artist_members`, `artists` (via `claimed_by_user_id`), `entity_claims`, `entity_followers`, `events` (via `reviewed_by`), `invite_audit_events` (via `actor_user_id`), `invite_link_claims` (via `accepted_by_user_id`), `invite_links` (via `created_by_user_id`, `revoked_by_user_id`), `organizers` (via `claimed_by_user_id`), `resale_listings` (via `seller_id`, `offered_to_user_id`), `support_ticket_messages` (via `sender_id`), `support_tickets` (via `user_id`, `assigned_admin_id`).

## Invites & Roles

- **invite_links**:
  - Referenced by: `invite_audit_events`, `invite_link_claims`.
- **user_roles**:
  - Links to: `auth.users`.

## Scanning

- **scan_accounts**:
  - Links to: `events`.
- **scan_events**:
  - Links to: `tickets`.

## Other

- **support_tickets**:
  - Referenced by: `support_ticket_messages`.
- **blogs**:
  - Standalone.
