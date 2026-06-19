import type { TicketTypeConfig, IssuedTicket, Order, ScanAccount, ScanEvent, PromoCode, PromoBatch } from 'reactticket-core';

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

export function mapDbRowToOrder(row: any): Order {
  return {
    id: row.id,
    eventId: row.event_id,
    items: row.items,
    buyerEmail: row.buyer_email,
    promoCode: row.promo_code,
    subtotalCents: row.subtotal_cents,
    discountCents: row.discount_cents,
    totalCents: row.total_cents,
    status: row.status,
    createdAt: row.created_at ? new Date(row.created_at) : new Date()
  };
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

export function mapDbRowToTicket(row: any): IssuedTicket {
  return {
    id: row.id,
    eventId: row.event_id,
    ticketTypeId: row.ticket_type_id,
    orderId: row.order_id,
    personalization: row.personalization,
    buyerEmail: row.buyer_email,
    issuedAt: row.issued_at ? new Date(row.issued_at) : new Date(),
    validFrom: row.valid_from ? new Date(row.valid_from) : undefined,
    validUntil: row.valid_until ? new Date(row.valid_until) : undefined,
    status: row.status,
    qrPayload: row.qr_payload,
    pricePaidCents: row.price_paid_cents,
    transferHistory: row.transfer_history,
    ownerId: row.owner_id
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

export function mapDbRowToScanEvent(row: any): ScanEvent {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    scannedAt: new Date(row.scanned_at),
    scannedByAccountId: row.scanned_by_account_id,
    scannedByAccountName: row.scanned_by_account_name,
    result: row.result,
    payload: row.payload,
    clockSkewSeconds: row.clock_skew_seconds,
    location: row.location
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

export function mapDbRowToPromoBatch(row: any): PromoBatch {
  return {
    id: row.id,
    eventId: row.event_id,
    config: row.config,
    codes: row.codes,
    createdAt: new Date(row.created_at)
  };
}

export function mapPromoBatchToRow(batch: PromoBatch): any {
  return {
    id: batch.id,
    event_id: batch.eventId,
    config: batch.config,
    codes: batch.codes,
    created_at: batch.createdAt.toISOString()
  };
}

export function mapEventToAdmitConfig(event: any): any {
  return {
    id: event.id,
    name: event.name,
    description: event.description,
    venue: event.location_name,
    startDate: event.start_time ? new Date(event.start_time) : new Date(),
    endDate: event.end_time ? new Date(event.end_time) : undefined,
    logoUrl: event.images?.[0] || undefined,
    organizerName: event.organizers?.name || 'Independent Organizer',
    timezone: event.timezone || 'UTC',
    ticketTypes: [],
    settings: {
      maxOrderSize: event.settings?.maxOrderSize || 10,
      requireBuyerEmail: true,
      adminKey: '',
    },
    theme: {
      bgColor: event.theme_customization?.bgColor,
      accentColor: event.theme_customization?.accentColor,
      textColor: event.theme_customization?.textColor,
      cardColor: event.theme_customization?.cardColor
    }
  };
}
