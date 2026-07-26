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
  createCheckoutTransaction?(order: Order, tickets: IssuedTicket[]): Promise<void>;
  getOrder(orderId: string): Promise<Order | null>;
  updateOrderStatus(orderId: string, status: Order['status']): Promise<void>;

  // Tickets
  getTicket(ticketId: string): Promise<IssuedTicket | null>;
  getTicketsByOrder(orderId: string): Promise<IssuedTicket[]>;
  getIssuedTickets(eventId: string): Promise<IssuedTicket[]>;
  saveTicket(ticket: IssuedTicket): Promise<void>;
  saveTickets(tickets: IssuedTicket[]): Promise<void>;
  updateTicketStatus(ticketId: string, status: IssuedTicket['status']): Promise<void>;
  deliverTicket(ticketId: string, qrPayload: string): Promise<void>;
  transferTicket(
    ticketId: string,
    toEmail: string,
    newPersonalization: TicketPersonalization
  ): Promise<void>;
  countIssuedTickets(ticketTypeId: string, eventId: string): Promise<number>;
  returnTicket(ticketId: string): Promise<void>;
  buyResaleTicket(listingId: string, buyerId: string): Promise<void>;

  // Promo Codes
  getPromoCode(code: string): Promise<PromoCode | null>;
  savePromoBatch(batch: PromoBatch): Promise<void>;
  listPromoBatches(): Promise<PromoBatch[]>;
  incrementPromoUsage(code: string): Promise<void>;

  // Scan Events
  saveScanEvent(scan: ScanEvent): Promise<void>;
  getScanEvents(eventId: string): Promise<ScanEvent[]>;
  getQueuedScanEvents(): Promise<ScanEvent[]>;
  queueScanEvent(scan: ScanEvent): Promise<void>;
  clearQueuedScanEvents(): Promise<void>;

  // Scan Accounts
  getScanAccount(accountId: string): Promise<ScanAccount | null>;
  getScanAccountByUsername(eventId: string, username: string): Promise<ScanAccount | null>;
  listScanAccounts(eventId: string): Promise<ScanAccount[]>;
  saveScanAccount(account: ScanAccount): Promise<void>;
  updateScanAccount(accountId: string, patch: Partial<ScanAccount>): Promise<void>;
  deleteScanAccount(accountId: string): Promise<void>;
  incrementScanAccountLoginTimestamp(accountId: string, at: Date): Promise<void>;

  // Friendships
  createFriendship(userId: string, friendId: string): Promise<void>;
  updateFriendshipStatus(
    friendshipId: string,
    status: 'pending' | 'accepted' | 'blocked'
  ): Promise<void>;
  getFriends(userId: string): Promise<any[]>;

  // Ticket Transfers
  createTransfer(ticketId: string, senderId: string, receiverId: string): Promise<void>;
  finalizeTransfer(transferId: string): Promise<void>;

  // Posts
  createPost(post: { user_id: string; event_id: string; is_public: boolean }): Promise<void>;

  // Waitlist
  joinWaitlist?(entry: Omit<import('./ticket.types').WaitlistEntry, 'id' | 'createdAt' | 'status'>): Promise<import('./ticket.types').WaitlistEntry>;
  getWaitlistEntries?(eventId: string, ticketTypeId?: string): Promise<import('./ticket.types').WaitlistEntry[]>;
  updateWaitlistStatus?(waitlistId: string, status: import('./ticket.types').WaitlistEntry['status']): Promise<void>;

  // Optional RPC overrides for atomicity
  validateTicketRpc?(
    ticketId: string,
    accountId: string,
    token: string,
    scannedAt: Date
  ): Promise<any>;

  // Server-side HMAC operations — when available, keeps signing secrets off the client
  verifyQRPayload?(qrPayload: string): Promise<boolean>;
  verifyScanToken?(token: string, expectedEventId: string): Promise<any>;
  createScanToken?(payload: object): Promise<string>;
}
