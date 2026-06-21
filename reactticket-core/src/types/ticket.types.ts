export type TicketPricingModel =
  | { kind: 'free' }
  | { kind: 'paid'; priceInCents: number; currency: string }
  | { kind: 'donation'; minCents?: number; suggestedCents?: number }
  | { kind: 'tiered'; tiers: PriceTier[] };

export interface PriceTier {
  label: string;
  priceInCents: number;
  availableUntil?: Date;
  capacity?: number;
}

export interface TicketTypeConfig {
  id: string;
  name: string;
  description?: string;
  pricing: TicketPricingModel;
  capacity?: number;
  soldCount?: number;
  maxPerOrder?: number;
  saleStartDate?: Date;
  saleEndDate?: Date;
  validFrom?: Date;
  validUntil?: Date;
  transferable: boolean;
  visible: boolean;
  archived?: boolean;
}

export interface TicketPersonalization {
  name: string;
  surname: string;
  country: string;
  city: string;
  email: string;
  phone?: string;
  zip?: string;
}

export interface IssuedTicket {
  readonly id: string;
  readonly eventId: string;
  readonly ticketTypeId: string;
  readonly orderId: string;
  readonly personalization: TicketPersonalization;
  readonly buyerEmail: string;
  readonly issuedAt: Date;
  readonly validFrom?: Date;
  readonly validUntil?: Date;
  readonly status: 'pending_delivery' | 'delivered' | 'used' | 'cancelled' | 'transferred';
  readonly qrPayload?: string;
  readonly transferHistory?: TransferRecord[];
  readonly promoCodeUsed?: string;
  readonly pricePaidCents: number;
  readonly ownerId?: string;
}

export interface TransferRecord {
  fromEmail: string;
  toEmail: string;
  at: Date;
}

export interface Order {
  readonly id: string;
  readonly eventId: string;
  readonly items: OrderItem[];
  readonly buyerEmail: string;
  readonly promoCode?: string;
  readonly subtotalCents: number;
  readonly discountCents: number;
  readonly totalCents: number;
  readonly status: 'pending' | 'confirmed' | 'refunded';
  readonly createdAt: Date;
  readonly buyerId?: string;
}

export interface OrderItem {
  ticketTypeId: string;
  quantity: number;
  unitPriceBeforeDiscountCents: number;
  unitPriceCents: number;
  personalizations: TicketPersonalization[];
}
