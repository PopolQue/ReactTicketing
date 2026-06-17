import { StorageAdapter } from '../types/adapter.types';
import { TicketTypeConfig, IssuedTicket, Order } from '../types/ticket.types';
import { PromoCode, PromoBatch } from '../types/promo.types';
import { ScanEvent } from '../types/scan.types';
import { ScanAccount } from '../types/scanAccount.types';

export class LocalStorageAdapter implements StorageAdapter {
  readonly name = 'LocalStorageAdapter';

  private getStorageKey(eventId: string, key: string): string {
    return `tf_${eventId}_${key}`;
  }

  // Ticket Types
  async getTicketTypes(eventId: string): Promise<TicketTypeConfig[]> {
    const data = localStorage.getItem(this.getStorageKey(eventId, 'ticketTypes'));
    return data ? JSON.parse(data) : [];
  }
  async saveTicketType(eventId: string, type: TicketTypeConfig): Promise<void> {
    const types = await this.getTicketTypes(eventId);
    const index = types.findIndex((t) => t.id === type.id);
    if (index > -1) {
      types[index] = type;
    } else {
      types.push(type);
    }
    localStorage.setItem(this.getStorageKey(eventId, 'ticketTypes'), JSON.stringify(types));
  }

  async deleteTicketType(eventId: string, ticketTypeId: string): Promise<void> {
    const types = await this.getTicketTypes(eventId);
    const updated = types.filter(t => t.id !== ticketTypeId);
    localStorage.setItem(this.getStorageKey(eventId, 'ticketTypes'), JSON.stringify(updated));
  }

  // Orders
  async createOrder(order: Order): Promise<void> {
    const orders = await this.getAllOrders(order.eventId);
    orders.push(order);
    localStorage.setItem(this.getStorageKey(order.eventId, 'orders'), JSON.stringify(orders));
  }
  async createCheckoutTransaction(order: Order, tickets: IssuedTicket[]): Promise<void> {
    await this.createOrder(order);
    await this.saveTickets(tickets);
    await this.updateOrderStatus(order.id, 'confirmed');
  }
  async getOrder(orderId: string): Promise<Order | null> {
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.endsWith('_orders')) {
            const data = localStorage.getItem(key);
            if (data) {
                const orders: Order[] = JSON.parse(data);
                const found = orders.find(o => o.id === orderId);
                if (found) return found;
            }
        }
    }
    return null;
  }
  private async getAllOrders(eventId: string): Promise<Order[]> {
    const data = localStorage.getItem(this.getStorageKey(eventId, 'orders'));
    return data ? JSON.parse(data) : [];
  }
  async updateOrderStatus(orderId: string, status: Order["status"]): Promise<void> {
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('tf_') && key.endsWith('_orders')) {
            const data = localStorage.getItem(key);
            if (data) {
                const orders: Order[] = JSON.parse(data);
                const index = orders.findIndex(o => o.id === orderId);
                if (index > -1) {
                    orders[index] = { ...orders[index], status };
                    localStorage.setItem(key, JSON.stringify(orders));
                    return;
                }
            }
        }
    }
  }

  // Tickets
  async getTicket(ticketId: string): Promise<IssuedTicket | null> {
    // This is tricky without a mapping of ticketId -> eventId
    // We'll search all events for now
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('tf_') && key.endsWith('_tickets')) {
            const data = localStorage.getItem(key);
            if (data) {
                const tickets: IssuedTicket[] = JSON.parse(data);
                const found = tickets.find(t => t.id === ticketId);
                if (found) return found;
            }
        }
    }
    return null;
  }
  async getTicketsByOrder(orderId: string): Promise<IssuedTicket[]> {
    const results: IssuedTicket[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('tf_') && key.endsWith('_tickets')) {
            const data = localStorage.getItem(key);
            if (data) {
                const tickets: IssuedTicket[] = JSON.parse(data);
                results.push(...tickets.filter(t => t.orderId === orderId));
            }
        }
    }
    return results;
  }
  async getIssuedTickets(eventId: string): Promise<IssuedTicket[]> {
    const data = localStorage.getItem(this.getStorageKey(eventId, 'tickets'));
    return data ? JSON.parse(data) : [];
  }
  async saveTicket(ticket: IssuedTicket): Promise<void> {
    const key = this.getStorageKey(ticket.eventId, 'tickets');
    const tickets = await this.getIssuedTickets(ticket.eventId);
    tickets.push(ticket);
    localStorage.setItem(key, JSON.stringify(tickets));
  }
  async saveTickets(newTickets: IssuedTicket[]): Promise<void> {
    if (newTickets.length === 0) return;
    const eventId = newTickets[0].eventId;
    const key = this.getStorageKey(eventId, 'tickets');
    const tickets = await this.getIssuedTickets(eventId);
    tickets.push(...newTickets);
    localStorage.setItem(key, JSON.stringify(tickets));
  }
  async updateTicketStatus(ticketId: string, status: IssuedTicket["status"]): Promise<void> {
    // Need to find which event this ticket belongs to
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('tf_') && key.endsWith('_tickets')) {
            const data = localStorage.getItem(key);
            if (data) {
                const tickets: IssuedTicket[] = JSON.parse(data);
                const index = tickets.findIndex(t => t.id === ticketId);
                if (index > -1) {
                    tickets[index] = { ...tickets[index], status };
                    localStorage.setItem(key, JSON.stringify(tickets));
                    return;
                }
            }
        }
    }
  }

  async deliverTicket(ticketId: string, qrPayload: string): Promise<void> {
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('tf_') && key.endsWith('_tickets')) {
            const data = localStorage.getItem(key);
            if (data) {
                const tickets: IssuedTicket[] = JSON.parse(data);
                const index = tickets.findIndex(t => t.id === ticketId);
                if (index > -1) {
                    tickets[index] = { ...tickets[index], status: 'delivered', qrPayload };
                    localStorage.setItem(key, JSON.stringify(tickets));
                    return;
                }
            }
        }
    }
  }

  async transferTicket(ticketId: string, toEmail: string, newPersonalization: import('../types/ticket.types').TicketPersonalization): Promise<void> {
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('tf_') && key.endsWith('_tickets')) {
            const data = localStorage.getItem(key);
            if (data) {
                const tickets: IssuedTicket[] = JSON.parse(data);
                const index = tickets.findIndex(t => t.id === ticketId);
                if (index > -1) {
                    const ticket = tickets[index];
                    const transferHistory = [
                        ...(ticket.transferHistory || []),
                        {
                            fromEmail: ticket.personalization.email,
                            toEmail: toEmail,
                            at: new Date()
                        }
                    ];
                    tickets[index] = { ...ticket, transferHistory, personalization: newPersonalization };
                    localStorage.setItem(key, JSON.stringify(tickets));
                    return;
                }
            }
        }
    }
  }
  async countIssuedTickets(ticketTypeId: string, eventId: string): Promise<number> {
    const tickets = await this.getIssuedTickets(eventId);
    const filtered = tickets.filter(t => t.ticketTypeId === ticketTypeId && t.status !== 'cancelled');
    return filtered.length;
  }
  async returnTicket(ticketId: string): Promise<void> {
    await this.updateTicketStatus(ticketId, "cancelled");
  }
  async buyResaleTicket(listingId: string, buyerId: string): Promise<void> {
    console.warn('buyResaleTicket not implemented completely in LocalStorageAdapter');
  }

  // Promo Codes
  async getPromoCode(code: string): Promise<PromoCode | null> {
    const batches = await this.listPromoBatches();
    for (const batch of batches) {
      const codeFound = batch.codes.find(c => c.code === code);
      if (codeFound) return codeFound;
    }
    return null;
  }
  async savePromoBatch(batch: PromoBatch): Promise<void> {
    const data = localStorage.getItem('tf_promo_batches');
    const batches: PromoBatch[] = data ? JSON.parse(data) : [];
    const index = batches.findIndex(b => b.id === batch.id);
    if (index > -1) {
      batches[index] = batch;
    } else {
      batches.push(batch);
    }
    localStorage.setItem('tf_promo_batches', JSON.stringify(batches));
  }
  async incrementPromoUsage(code: string): Promise<void> {
    const batches = await this.listPromoBatches();
    let updated = false;
    for (const batch of batches) {
      const codeFound = batch.codes.find(c => c.code === code);
      if (codeFound) {
        codeFound.usedCount++;
        updated = true;
        break;
      }
    }
    if (updated) {
      localStorage.setItem('tf_promo_batches', JSON.stringify(batches));
    }
  }
  async listPromoBatches(): Promise<PromoBatch[]> {
    const data = localStorage.getItem('tf_promo_batches');
    return data ? JSON.parse(data) : [];
  }

  // Scan Events
  async saveScanEvent(scan: ScanEvent): Promise<void> {
    const data = localStorage.getItem('tf_scan_events');
    const events: ScanEvent[] = data ? JSON.parse(data) : [];
    events.push(scan);
    localStorage.setItem('tf_scan_events', JSON.stringify(events));
  }
  async getQueuedScanEvents(): Promise<ScanEvent[]> {
    const data = localStorage.getItem('tf_offline_scan_queue');
    return data ? JSON.parse(data) : [];
  }
  async queueScanEvent(scan: ScanEvent): Promise<void> {
    const queue = await this.getQueuedScanEvents();
    queue.push(scan);
    localStorage.setItem('tf_offline_scan_queue', JSON.stringify(queue));
  }
  async clearQueuedScanEvents(): Promise<void> {
    localStorage.removeItem('tf_offline_scan_queue');
  }
  async getScanEvents(eventId: string): Promise<ScanEvent[]> {
    const data = localStorage.getItem('tf_scan_events');
    const events: ScanEvent[] = data ? JSON.parse(data) : [];
    const eventTickets = await this.getIssuedTickets(eventId);
    const validTicketIds = new Set(eventTickets.map(t => t.id));
    return events.filter(e => validTicketIds.has(e.ticketId));
  }

  // Scan Accounts
  async getScanAccount(accountId: string): Promise<ScanAccount | null> {
    const accounts = await this.listAllScanAccounts();
    return accounts.find(a => a.id === accountId) || null;
  }
  async getScanAccountByUsername(eventId: string, username: string): Promise<ScanAccount | null> {
    const accounts = await this.listScanAccounts(eventId);
    return accounts.find(a => a.username === username) || null;
  }
  async listScanAccounts(eventId: string): Promise<ScanAccount[]> {
    const accounts = await this.listAllScanAccounts();
    return accounts.filter(a => a.eventId === eventId);
  }
  private async listAllScanAccounts(): Promise<ScanAccount[]> {
    const data = localStorage.getItem('tf_scan_accounts');
    return data ? JSON.parse(data) : [];
  }
  async saveScanAccount(account: ScanAccount): Promise<void> {
    const accounts = await this.listAllScanAccounts();
    const index = accounts.findIndex(a => a.id === account.id);
    if (index > -1) {
      accounts[index] = account;
    } else {
      accounts.push(account);
    }
    localStorage.setItem('tf_scan_accounts', JSON.stringify(accounts));
  }
  async updateScanAccount(accountId: string, patch: Partial<ScanAccount>): Promise<void> {
    const accounts = await this.listAllScanAccounts();
    const index = accounts.findIndex(a => a.id === accountId);
    if (index > -1) {
      accounts[index] = { ...accounts[index], ...patch };
      localStorage.setItem('tf_scan_accounts', JSON.stringify(accounts));
    }
  }
  async deleteScanAccount(accountId: string): Promise<void> {
    const accounts = await this.listAllScanAccounts();
    const updated = accounts.filter(a => a.id !== accountId);
    localStorage.setItem('tf_scan_accounts', JSON.stringify(updated));
  }
  async incrementScanAccountLoginTimestamp(accountId: string, at: Date): Promise<void> {
    const accounts = await this.listAllScanAccounts();
    const index = accounts.findIndex(a => a.id === accountId);
    if (index > -1) {
      accounts[index] = { ...accounts[index], lastLoginAt: at };
      localStorage.setItem('tf_scan_accounts', JSON.stringify(accounts));
    }
  }
}
