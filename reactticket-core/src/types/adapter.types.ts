import { TicketTypeConfig, IssuedTicket, Order, TicketPersonalization } from './ticket.types';
import { PromoCode, PromoBatch } from './promo.types';
import { ScanEvent } from './scan.types';
import { ScanAccount } from './scanAccount.types';

export interface StorageAdapter {
  readonly name: string;

  getTicketTypes(eventId: string): Promise<TicketTypeConfig[]>;
  saveTicketType(eventId: string, type: TicketTypeConfig): Promise<void>;
  deleteTicketType(eventId: string, ticketTypeId: string): Promise<void>;

  createOrder(order: Order): Promise<void>;
  getOrder(orderId: string): Promise<Order | null>;
  updateOrderStatus(orderId: string, status: Order["status"]): Promise<void>;

  // Tickets
  getTicket(ticketId: string): Promise<IssuedTicket | null>;
  getTicketsByOrder(orderId: string): Promise<IssuedTicket[]>;
  getIssuedTickets(eventId: string): Promise<IssuedTicket[]>;
  saveTicket(ticket: IssuedTicket): Promise<void>;
  updateTicketStatus(ticketId: string, status: IssuedTicket["status"]): Promise<void>;
  deliverTicket(ticketId: string, qrPayload: string): Promise<void>;
  transferTicket(ticketId: string, toEmail: string, newPersonalization: TicketPersonalization): Promise<void>;
  countIssuedTickets(ticketTypeId: string, eventId: string): Promise<number>;

  // Promo Codes
  getPromoCode(code: string): Promise<PromoCode | null>;
  savePromoBatch(batch: PromoBatch): Promise<void>;
  listPromoBatches(): Promise<PromoBatch[]>;
  incrementPromoUsage(code: string): Promise<void>;

  // Scan Events
  saveScanEvent(scan: ScanEvent): Promise<void>;
  getScanEvents(eventId: string): Promise<ScanEvent[]>;

  // Scan Accounts
  getScanAccount(accountId: string): Promise<ScanAccount | null>;
  getScanAccountByUsername(eventId: string, username: string): Promise<ScanAccount | null>;
  listScanAccounts(eventId: string): Promise<ScanAccount[]>;
  saveScanAccount(account: ScanAccount): Promise<void>;
  updateScanAccount(accountId: string, patch: Partial<ScanAccount>): Promise<void>;
  deleteScanAccount(accountId: string): Promise<void>;
  incrementScanAccountLoginTimestamp(accountId: string, at: Date): Promise<void>;
}
