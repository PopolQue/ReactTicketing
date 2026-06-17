import { StorageAdapter } from '../types/adapter.types';
import { TicketTypeConfig, IssuedTicket, Order } from '../types/ticket.types';
import { PromoCode, PromoBatch } from '../types/promo.types';
import { ScanEvent } from '../types/scan.types';
import { ScanAccount } from '../types/scanAccount.types';

export interface RestAdapterConfig {
  baseUrl: string;
  authToken: () => string | null;
  onUnauthorized?: () => void;
}

export class RestAdapter implements StorageAdapter {
  readonly name = 'RestAdapter';

  constructor(private config: RestAdapterConfig) {}

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = {
      'Content-Type': 'application/json',
      ...(this.config.authToken() ? { Authorization: `Bearer ${this.config.authToken()}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${this.config.baseUrl}${endpoint}`, { ...options, headers });

    if (response.status === 401 && this.config.onUnauthorized) {
      this.config.onUnauthorized();
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  // Ticket Types
  async getTicketTypes(eventId: string): Promise<TicketTypeConfig[]> {
    return this.request<TicketTypeConfig[]>(`/events/${eventId}/ticket-types`);
  }
  async saveTicketType(eventId: string, type: TicketTypeConfig): Promise<void> {
    await this.request(`/events/${eventId}/ticket-types`, {
      method: 'POST',
      body: JSON.stringify(type),
    });
  }
  async deleteTicketType(eventId: string, ticketTypeId: string): Promise<void> {
    await this.request(`/events/${eventId}/ticket-types/${ticketTypeId}`, { method: 'DELETE' });
  }

  // Orders
  async createOrder(order: Order): Promise<void> {
    await this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  }
  async getOrder(orderId: string): Promise<Order | null> {
    return this.request<Order>(`/orders/${orderId}`);
  }
  async updateOrderStatus(orderId: string, status: Order["status"]): Promise<void> {
    await this.request(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Tickets
  async getTicket(ticketId: string): Promise<IssuedTicket | null> {
    return this.request<IssuedTicket>(`/tickets/${ticketId}`);
  }
  async getTicketsByOrder(orderId: string): Promise<IssuedTicket[]> {
    return this.request<IssuedTicket[]>(`/orders/${orderId}/tickets`);
  }
  async getIssuedTickets(eventId: string): Promise<IssuedTicket[]> {
    return this.request<IssuedTicket[]>(`/events/${eventId}/tickets`);
  }
  async saveTicket(ticket: IssuedTicket): Promise<void> {
    await this.request(`/tickets`, {
      method: 'POST',
      body: JSON.stringify(ticket),
    });
  }
  async saveTickets(tickets: IssuedTicket[]): Promise<void> {
    await this.request(`/tickets/batch`, {
      method: 'POST',
      body: JSON.stringify(tickets),
    });
  }
  async updateTicketStatus(ticketId: string, status: IssuedTicket["status"]): Promise<void> {
    await this.request(`/tickets/${ticketId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }
  async deliverTicket(ticketId: string, qrPayload: string): Promise<void> {
    await this.request(`/tickets/${ticketId}/deliver`, {
      method: 'POST',
      body: JSON.stringify({ qrPayload }),
    });
  }
  async transferTicket(ticketId: string, toEmail: string, newPersonalization: import('../types/ticket.types').TicketPersonalization): Promise<void> {
    await this.request(`/tickets/${ticketId}/transfer`, {
      method: 'POST',
      body: JSON.stringify({ toEmail, newPersonalization }),
    });
  }
  async countIssuedTickets(ticketTypeId: string, eventId: string): Promise<number> {
    const res = await this.request<{ count: number }>(`/ticket-types/${ticketTypeId}/issued-count`);
    return res.count;
  }
  async returnTicket(ticketId: string): Promise<void> {
    await this.request(`/tickets/${ticketId}/return`, { method: 'POST' });
  }
  async buyResaleTicket(listingId: string, buyerId: string): Promise<void> {
    await this.request(`/resale/${listingId}/buy`, {
      method: 'POST',
      body: JSON.stringify({ buyerId }),
    });
  }

  // Promo Codes
  async getPromoCode(code: string): Promise<PromoCode | null> {
    return this.request<PromoCode>(`/promo-codes/${code}`);
  }
  async savePromoBatch(batch: PromoBatch): Promise<void> {
    await this.request('/promo-batches', {
      method: 'POST',
      body: JSON.stringify(batch),
    });
  }
  async listPromoBatches(): Promise<PromoBatch[]> {
    return this.request<PromoBatch[]>(`/promo-batches`);
  }
  async incrementPromoUsage(code: string): Promise<void> {
    await this.request(`/promo-codes/${code}/increment`, { method: 'POST' });
  }

  // Scan Events
  async saveScanEvent(scan: ScanEvent): Promise<void> {
    await this.request('/scan-events', {
      method: 'POST',
      body: JSON.stringify(scan),
    });
  }
  async getScanEvents(eventId: string): Promise<ScanEvent[]> {
    return this.request<ScanEvent[]>(`/events/${eventId}/scan-events`);
  }
  async getQueuedScanEvents(): Promise<ScanEvent[]> {
    throw new Error('Offline queueing not supported by RestAdapter');
  }
  async queueScanEvent(_scan: ScanEvent): Promise<void> {
    throw new Error('Offline queueing not supported by RestAdapter');
  }
  async clearQueuedScanEvents(): Promise<void> {
    throw new Error('Offline queueing not supported by RestAdapter');
  }

  // Scan Accounts
  async getScanAccount(accountId: string): Promise<ScanAccount | null> {
    return this.request<ScanAccount>(`/scan-accounts/${accountId}`);
  }
  async getScanAccountByUsername(eventId: string, username: string): Promise<ScanAccount | null> {
    return this.request<ScanAccount>(`/events/${eventId}/scan-accounts/by-username/${username}`);
  }
  async listScanAccounts(eventId: string): Promise<ScanAccount[]> {
    return this.request<ScanAccount[]>(`/events/${eventId}/scan-accounts`);
  }
  async saveScanAccount(account: ScanAccount): Promise<void> {
    await this.request('/scan-accounts', {
      method: 'POST',
      body: JSON.stringify(account),
    });
  }
  async updateScanAccount(accountId: string, patch: Partial<ScanAccount>): Promise<void> {
    await this.request(`/scan-accounts/${accountId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  }
  async deleteScanAccount(accountId: string): Promise<void> {
    await this.request(`/scan-accounts/${accountId}`, { method: 'DELETE' });
  }
  async incrementScanAccountLoginTimestamp(accountId: string, at: Date): Promise<void> {
    await this.request(`/scan-accounts/${accountId}/login`, {
      method: 'POST',
      body: JSON.stringify({ at }),
    });
  }
}
