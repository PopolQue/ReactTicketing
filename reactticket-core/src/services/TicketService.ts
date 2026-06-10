import { StorageAdapter } from "reactticket-core/types/adapter.types";
import { IssuedTicket, TicketTypeConfig } from "reactticket-core/types/ticket.types";
import { QRGenerator } from "./QRGenerator";
import { AuthService } from "./AuthService";

export class TicketService {
  constructor(private adapter: StorageAdapter, private authService: AuthService) {}
async issueTickets(orderId: string): Promise<IssuedTicket[]> {
  console.log("Issuing tickets for order:", orderId);
  const order = await this.adapter.getOrder(orderId);
  if (!order) {
      throw new Error("Order not found");
  }

  const tickets: IssuedTicket[] = [];
  const enc = new TextEncoder();
  const keyData = enc.encode(this.authService.getSecret());
  const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);

  // Fetch ticket types once for the event
  const ticketTypes = await this.adapter.getTicketTypes(order.eventId);

  for (const item of order.items) {
    const ticketType = ticketTypes.find(t => t.id === item.ticketTypeId);
    
    for (let i = 0; i < item.quantity; i++) {
      const ticketId = `tkt_${Math.random().toString(36).substring(7)}`;
      const payloadBase = `TF1.${order.eventId}.${ticketId}`;
      const hmacBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(payloadBase));
      const hmac = btoa(String.fromCharCode(...new Uint8Array(hmacBuffer))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

      const ticket: IssuedTicket = {
          id: ticketId,
          eventId: order.eventId,
          ticketTypeId: item.ticketTypeId,
          orderId: order.id,
          personalization: item.personalizations[i] || { name: 'Unknown', surname: 'Unknown', country: 'Unknown', city: 'Unknown', email: '' },
          buyerEmail: order.buyerEmail,
          issuedAt: new Date(),
          validFrom: ticketType?.validFrom,
          validUntil: ticketType?.validUntil,
          status: "valid",
          qrPayload: `${payloadBase}.${hmac}`,
          pricePaidCents: item.unitPriceCents,
      };
      await this.adapter.saveTicket(ticket);
      tickets.push(ticket);
    }
  }
  return tickets;
}

}
