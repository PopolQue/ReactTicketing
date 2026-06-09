import { TicketTypeConfig, IssuedTicket, Order } from './ticket.types';
import { PromoCode } from './promo.types';
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
getIssuedTickets(): Promise<IssuedTicket[]>;
saveTicket(ticket: IssuedTicket): Promise<void>;

  updateTicketStatus(ticketId: string, status: IssuedTicket["status"]): Promise<void>;
  countIssuedTickets(ticketTypeId: string): Promise<number>;

  getPromoCode(code: string): Promise<PromoCode | null>;
  savePromoCode(promo: PromoCode): Promise<void>;
  incrementPromoUsage(code: string): Promise<void>;
  listPromoCodes(eventId: string): Promise<PromoCode[]>;

  saveScanEvent(scan: ScanEvent): Promise<void>;
  getScanEvents(eventId: string): Promise<ScanEvent[]>;

  getScanAccount(accountId: string): Promise<ScanAccount | null>;
  getScanAccountByUsername(eventId: string, username: string): Promise<ScanAccount | null>;
  listScanAccounts(eventId: string): Promise<ScanAccount[]>;
  saveScanAccount(account: ScanAccount): Promise<void>;
  updateScanAccount(accountId: string, patch: Partial<ScanAccount>): Promise<void>;
  deleteScanAccount(accountId: string): Promise<void>;
  incrementScanAccountLoginTimestamp(accountId: string, at: Date): Promise<void>;
}
