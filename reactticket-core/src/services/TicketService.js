export class TicketService {
    adapter;
    authService;
    constructor(adapter, authService) {
        this.adapter = adapter;
        this.authService = authService;
    }
    async issueTickets(orderId) {
        const order = await this.adapter.getOrder(orderId);
        if (!order) {
            console.error("Order not found for issuance:", orderId);
            throw new Error("Order not found");
        }
        // 1. Capacity Check
        for (const item of order.items) {
            const ticketTypes = await this.adapter.getTicketTypes(order.eventId);
            const ticketType = ticketTypes.find(t => t.id === item.ticketTypeId);
            if (ticketType && ticketType.capacity !== undefined) {
                const issuedCount = await this.adapter.countIssuedTickets(item.ticketTypeId, order.eventId);
                if (issuedCount + item.quantity > ticketType.capacity) {
                    throw new Error(`Insufficient capacity for ticket type: ${ticketType.name}`);
                }
            }
        }
        const tickets = [];
        const ticketsToSave = [];
        for (const item of order.items) {
            const ticketType = (await this.adapter.getTicketTypes(order.eventId)).find(t => t.id === item.ticketTypeId);
            for (let i = 0; i < item.quantity; i++) {
                const ticketId = `tkt_${Math.random().toString(36).substring(7)}`;
                const ticket = {
                    id: ticketId,
                    eventId: order.eventId,
                    ticketTypeId: item.ticketTypeId,
                    orderId: order.id,
                    personalization: item.personalizations[i] || { name: 'Unknown', surname: 'Unknown', country: 'Unknown', city: 'Unknown', email: 'unknown@example.com' },
                    buyerEmail: order.buyerEmail,
                    issuedAt: new Date(),
                    validFrom: ticketType?.validFrom ? new Date(ticketType.validFrom) : undefined,
                    validUntil: ticketType?.validUntil ? new Date(ticketType.validUntil) : undefined,
                    status: "pending_delivery",
                    pricePaidCents: item.unitPriceCents,
                };
                ticketsToSave.push(ticket);
                tickets.push(ticket);
            }
        }
        if (ticketsToSave.length > 0) {
            await this.adapter.saveTickets(ticketsToSave);
        }
        return tickets;
    }
    async deliverTicket(ticketId) {
        const ticket = await this.adapter.getTicket(ticketId);
        if (!ticket)
            throw new Error("Ticket not found");
        if (ticket.status === "cancelled")
            throw new Error("Cannot deliver cancelled ticket");
        // Deriving HMAC key from secret
        const enc = new TextEncoder();
        const keyData = enc.encode(this.authService.getQrSecret());
        const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
        // Payload: TF1.<eventId>.<ticketId>
        const payloadBase = `TF1.${ticket.eventId}.${ticketId}`;
        const hmacBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(payloadBase));
        const hmacArray = new Uint8Array(hmacBuffer);
        const hmac = btoa(Array.from(hmacArray, b => String.fromCharCode(b)).join('')).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
        const qrPayload = `${payloadBase}.${hmac}`;
        await this.adapter.deliverTicket(ticketId, qrPayload);
    }
    async transferTicket(ticketId, toEmail, newPersonalization) {
        const ticket = await this.adapter.getTicket(ticketId);
        if (!ticket)
            throw new Error("Ticket not found");
        if (ticket.status !== "pending_delivery") {
            throw new Error("Cannot transfer a ticket that has already been delivered or cancelled.");
        }
        await this.adapter.transferTicket(ticketId, toEmail, newPersonalization);
    }
}
