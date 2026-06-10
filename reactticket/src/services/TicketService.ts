import { StorageAdapter } from "reactticket-core/types/adapter.types";
import { IssuedTicket, TicketTypeConfig } from "reactticket-core/types/ticket.types";
import { QRGenerator } from "./QRGenerator";
import { AuthService } from "./AuthService";

export class TicketService {
  constructor(private adapter: StorageAdapter, private authService: AuthService) {}
async issueTickets(orderId: string): Promise<IssuedTicket[]> {
  console.log("Issuing tickets for order:", orderId);
  const order = await this.adapter.getOrder(orderId);
  console.log("Order retrieved:", order);
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

  const tickets: IssuedTicket[] = [];
  // Deriving HMAC key from secret
  const enc = new TextEncoder();
  const keyData = enc.encode(this.authService.getSecret());
  const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);

  for (const item of order.items) {
    const ticketType = (await this.adapter.getTicketTypes(order.eventId)).find(t => t.id === item.ticketTypeId);
    for (let i = 0; i < item.quantity; i++) {
      const ticketId = `tkt_${Math.random().toString(36).substring(7)}`;

      // Payload: TF1.<eventId>.<ticketId>
      const payloadBase = `TF1.${order.eventId}.${ticketId}`;
      const hmacBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(payloadBase));
      const hmacArray = new Uint8Array(hmacBuffer);
      const hmac = btoa(Array.from(hmacArray, b => String.fromCharCode(b)).join('')).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

      const qrPayload = `${payloadBase}.${hmac}`;

      const ticket: IssuedTicket = {
          id: ticketId,
          eventId: order.eventId,
          ticketTypeId: item.ticketTypeId,
          orderId: order.id,
          personalization: item.personalizations[i] || { name: 'Unknown', surname: 'Unknown', country: 'Unknown', city: 'Unknown', email: 'unknown@example.com' },
          buyerEmail: order.buyerEmail,
          issuedAt: new Date(),
          validFrom: ticketType?.validFrom ? new Date(ticketType.validFrom) : undefined,
          validUntil: ticketType?.validUntil ? new Date(ticketType.validUntil) : undefined,
          status: "valid",
          qrPayload,
          pricePaidCents: item.unitPriceCents,
      };
      await this.adapter.saveTicket(ticket);
      tickets.push(ticket);
    }
  }
  return tickets;
}

}
