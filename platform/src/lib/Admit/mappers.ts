import type { TicketTypeConfig, IssuedTicket, Order } from 'reactticket-core';
import type { ScanAccount } from 'reactticket-core';
import type { ScanEvent } from 'reactticket-core';
import type { PromoCode, PromoBatch } from 'reactticket-core';

export function mapDbRowToTicketTypeConfig(row: any): TicketTypeConfig {
  return {
    id: row.id,
    eventId: row.event_id,
    name: row.name,
    description: row.description,
    pricing: row.pricing,
    capacity: row.capacity,
    maxPerOrder: row.max_per_order,
    saleStartDate: row.sale_start_date ? new Date(row.sale_start_date) : undefined,
    saleEndDate: row.sale_end_date ? new Date(row.sale_end_date) : undefined,
    validFrom: row.valid_from ? new Date(row.valid_from) : undefined,
    validUntil: row.valid_until ? new Date(row.valid_until) : undefined,
    transferable: row.transferable,
    visible: row.visible,
    archived: row.archived
  };
}

export function mapTicketTypeConfigToRow(eventId: string, config: TicketTypeConfig): any {
  return {
    id: config.id,
    event_id: eventId,
    name: config.name,
    description: config.description,
    pricing: config.pricing,
    capacity: config.capacity,
    max_per_order: config.maxPerOrder,
    sale_start_date: config.saleStartDate?.toISOString(),
    sale_end_date: config.saleEndDate?.toISOString(),
    valid_from: config.validFrom?.toISOString(),
    valid_until: config.validUntil?.toISOString(),
    transferable: config.transferable,
    visible: config.visible,
    archived: config.archived
  };
}

export function mapDbRowToScanAccount(row: any): ScanAccount {
  return {
    id: row.id,
    eventId: row.event_id,
    username: row.username,
    pinHash: row.pin_hash,
    pinSalt: row.pin_salt,
    credentialVersion: row.credential_version,
    active: row.active,
    createdAt: new Date(row.created_at),
    createdByAdmin: row.created_by_admin,
    assignedLocation: row.assigned_location,
    lastLoginAt: row.last_login_at ? new Date(row.last_login_at) : undefined
  };
}

export function mapScanAccountToRow(account: ScanAccount): any {
  return {
    id: account.id,
    event_id: account.eventId,
    username: account.username,
    pin_hash: account.pinHash,
    pin_salt: account.pinSalt,
    credential_version: account.credentialVersion,
    active: account.active,
    created_at: account.createdAt?.toISOString(),
    created_by_admin: account.createdByAdmin,
    assigned_location: account.assignedLocation,
    last_login_at: account.lastLoginAt?.toISOString()
  };
}

export function mapScanAccountPatchToRow(patch: Partial<ScanAccount>): any {
  const row: any = {};
  if (patch.username !== undefined) row.username = patch.username;
  if (patch.pinHash !== undefined) row.pin_hash = patch.pinHash;
  if (patch.pinSalt !== undefined) row.pin_salt = patch.pinSalt;
  if (patch.credentialVersion !== undefined) row.credential_version = patch.credentialVersion;
  if (patch.active !== undefined) row.active = patch.active;
  if (patch.assignedLocation !== undefined) row.assigned_location = patch.assignedLocation;
  if (patch.lastLoginAt !== undefined) row.last_login_at = patch.lastLoginAt?.toISOString();
  return row;
}

export function mapOrderToRow(order: Order): any {
  return {
    id: order.id,
    event_id: order.eventId,
    items: order.items,
    buyer_email: order.buyerEmail,
    promo_code: order.promoCode,
    subtotal_cents: order.subtotalCents,
    discount_cents: order.discountCents,
    total_cents: order.totalCents,
    status: order.status,
    created_at: order.createdAt?.toISOString()
  };
}

export function mapTicketToRow(ticket: IssuedTicket): any {
  return {
    id: ticket.id,
    event_id: ticket.eventId,
    ticket_type_id: ticket.ticketTypeId,
    order_id: ticket.orderId,
    personalization: ticket.personalization,
    buyer_email: ticket.buyerEmail,
    issued_at: ticket.issuedAt?.toISOString(),
    valid_from: ticket.validFrom?.toISOString(),
    valid_until: ticket.validUntil?.toISOString(),
    status: ticket.status,
    qr_payload: ticket.qrPayload,
    price_paid_cents: ticket.pricePaidCents,
    transfer_history: ticket.transferHistory,
    owner_id: ticket.ownerId
  };
}

export function mapScanEventToRow(scan: ScanEvent): any {
  return {
    id: scan.id,
    ticket_id: scan.ticketId,
    scanned_at: scan.scannedAt.toISOString(),
    scanned_by_account_id: scan.scannedByAccountId,
    scanned_by_account_name: scan.scannedByAccountName,
    result: scan.result,
    payload: scan.payload,
    clock_skew_seconds: scan.clockSkewSeconds,
    location: scan.location
  };
}

export function mapEventToAdmitConfig(event: any): any {
  return {
    id: event.id,
    name: event.name,
    theme: event.theme_customization
  };
}
