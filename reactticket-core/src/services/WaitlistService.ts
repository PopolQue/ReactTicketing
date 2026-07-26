import { StorageAdapter } from '../types/adapter.types';
import { WaitlistEntry } from '../types/ticket.types';

export class WaitlistService {
  constructor(private adapter: StorageAdapter) {}

  async joinWaitlist(
    eventId: string,
    ticketTypeId: string,
    userEmail: string,
    userName?: string,
    quantity: number = 1
  ): Promise<WaitlistEntry> {
    if (!userEmail || !userEmail.includes('@')) {
      throw new Error('Invalid email address for waitlist registration');
    }
    if (quantity < 1) {
      throw new Error('Quantity must be at least 1');
    }

    if (this.adapter.joinWaitlist) {
      return this.adapter.joinWaitlist({
        eventId,
        ticketTypeId,
        userEmail,
        userName,
        quantity,
      });
    }

    // Fallback in-memory / generic object creation if adapter has no specialized handler
    const newEntry: WaitlistEntry = {
      id: `wl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      eventId,
      ticketTypeId,
      userEmail,
      userName,
      quantity,
      status: 'pending',
      createdAt: new Date(),
    };
    return newEntry;
  }

  async getWaitlistEntries(eventId: string, ticketTypeId?: string): Promise<WaitlistEntry[]> {
    if (this.adapter.getWaitlistEntries) {
      return this.adapter.getWaitlistEntries(eventId, ticketTypeId);
    }
    return [];
  }

  async notifyNextInLine(eventId: string, ticketTypeId: string): Promise<WaitlistEntry | null> {
    const entries = await this.getWaitlistEntries(eventId, ticketTypeId);
    const pending = entries.filter((e) => e.status === 'pending');

    if (pending.length === 0) return null;

    // First in line
    const next = pending[0];
    if (this.adapter.updateWaitlistStatus) {
      await this.adapter.updateWaitlistStatus(next.id, 'notified');
    }
    return { ...next, status: 'notified', notifiedAt: new Date() };
  }
}
