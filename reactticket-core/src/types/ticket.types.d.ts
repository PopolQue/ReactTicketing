export type TicketPricingModel = {
    kind: "free";
} | {
    kind: "paid";
    priceInCents: number;
    currency: string;
} | {
    kind: "donation";
    minCents?: number;
    suggestedCents?: number;
} | {
    kind: "tiered";
    tiers: PriceTier[];
};
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
    id: string;
    eventId: string;
    ticketTypeId: string;
    orderId: string;
    personalization: TicketPersonalization;
    buyerEmail: string;
    issuedAt: Date;
    validFrom?: Date;
    validUntil?: Date;
    status: "pending_delivery" | "delivered" | "used" | "cancelled" | "transferred";
    qrPayload?: string;
    transferHistory?: TransferRecord[];
    promoCodeUsed?: string;
    pricePaidCents: number;
}
export interface TransferRecord {
    fromEmail: string;
    toEmail: string;
    at: Date;
}
export interface Order {
    id: string;
    eventId: string;
    items: OrderItem[];
    buyerEmail: string;
    promoCode?: string;
    subtotalCents: number;
    discountCents: number;
    totalCents: number;
    status: "pending" | "confirmed" | "refunded";
    createdAt: Date;
}
export interface OrderItem {
    ticketTypeId: string;
    quantity: number;
    unitPriceBeforeDiscountCents: number;
    unitPriceCents: number;
    personalizations: TicketPersonalization[];
}
