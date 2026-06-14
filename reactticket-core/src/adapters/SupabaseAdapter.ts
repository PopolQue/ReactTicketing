import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { StorageAdapter } from '../types/adapter.types';
import { TicketTypeConfig, IssuedTicket, Order } from '../types/ticket.types';
import { PromoCode, PromoBatch } from '../types/promo.types';
import { ScanEvent } from '../types/scan.types';
import { ScanAccount } from '../types/scanAccount.types';

export class SupabaseAdapter implements StorageAdapter {
  readonly name = 'SupabaseAdapter';
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async getTicketTypes(eventId: string): Promise<TicketTypeConfig[]> {
    const { data, error } = await this.supabase
      .from('ticket_types')
      .select('*')
      .eq('event_id', eventId);
    if (error) throw error;
    return data || [];
  }

  async saveTicketType(eventId: string, type: TicketTypeConfig): Promise<void> {
    const { error } = await this.supabase
      .from('ticket_types')
      .upsert({ ...type, event_id: eventId });
    if (error) throw error;
  }

  async deleteTicketType(eventId: string, ticketTypeId: string): Promise<void> {
    const { error } = await this.supabase
      .from('ticket_types')
      .delete()
      .eq('id', ticketTypeId);
    if (error) throw error;
  }

  async createOrder(order: Order): Promise<void> {
    const { error } = await this.supabase
      .from('orders')
      .insert({ ...order, event_id: order.eventId });
    if (error) throw error;
  }

  async getOrder(orderId: string): Promise<Order | null> {
    const { data, error } = await this.supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
    if (error) return null;
    return data;
  }

  async updateOrderStatus(orderId: string, status: Order["status"]): Promise<void> {
    const { error } = await this.supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);
    if (error) throw error;
  }

  async getTicket(ticketId: string): Promise<IssuedTicket | null> {
    const { data, error } = await this.supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single();
    if (error) return null;
    return data;
  }

  async getTicketsByOrder(orderId: string): Promise<IssuedTicket[]> {
    const { data, error } = await this.supabase
      .from('tickets')
      .select('*')
      .eq('order_id', orderId);
    if (error) throw error;
    return data || [];
  }

  async getIssuedTickets(eventId: string): Promise<IssuedTicket[]> {
    const { data, error } = await this.supabase
      .from('tickets')
      .select('*')
      .eq('event_id', eventId);
    if (error) throw error;
    return data || [];
  }

  async saveTicket(ticket: IssuedTicket): Promise<void> {
    const { error } = await this.supabase
      .from('tickets')
      .upsert({ ...ticket, event_id: ticket.eventId });
    if (error) throw error;
  }

  async saveTickets(tickets: IssuedTicket[]): Promise<void> {
    const mappedTickets = tickets.map(t => ({
      ...t,
      event_id: t.eventId,
      ticket_type_id: t.ticketTypeId,
      order_id: t.orderId,
      buyer_email: t.buyerEmail,
      issued_at: t.issuedAt,
      valid_from: t.validFrom,
      valid_until: t.validUntil,
      price_paid_cents: t.pricePaidCents
    }));
    const { error } = await this.supabase.rpc('create_tickets_transaction', {
      p_tickets: mappedTickets
    });
    if (error) throw error;
  }


  async updateTicketStatus(ticketId: string, status: IssuedTicket["status"]): Promise<void> {
    const { error } = await this.supabase
      .from('tickets')
      .update({ status })
      .eq('id', ticketId);
    if (error) throw error;
  }

  async deliverTicket(ticketId: string, qrPayload: string): Promise<void> {
    const { error } = await this.supabase
      .from('tickets')
      .update({ status: 'delivered', qr_payload: qrPayload })
      .eq('id', ticketId);
    if (error) throw error;
  }

  async transferTicket(ticketId: string, toEmail: string, newPersonalization: import('../types/ticket.types').TicketPersonalization): Promise<void> {
    const ticket = await this.getTicket(ticketId);
    if (!ticket) throw new Error('Ticket not found');
    
    const history = ticket.transferHistory || [];
    history.push({
      fromEmail: ticket.personalization.email,
      toEmail,
      at: new Date()
    });

    const { error } = await this.supabase
      .from('tickets')
      .update({ 
        personalization: newPersonalization,
        transfer_history: history
      })
      .eq('id', ticketId);
    if (error) throw error;
  }

  async countIssuedTickets(ticketTypeId: string, eventId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('ticket_type_id', ticketTypeId)
      .eq('event_id', eventId)
      .neq('status', 'cancelled');
    if (error) throw error;
    return count || 0;
  }

  // Promo Codes (Implementation details would follow similar patterns...)
  async getPromoCode(code: string): Promise<PromoCode | null> { return null; }
  async savePromoBatch(batch: PromoBatch): Promise<void> {}
  async listPromoBatches(): Promise<PromoBatch[]> { return []; }
  async incrementPromoUsage(code: string): Promise<void> {}

  // Scan Events
  async saveScanEvent(scan: ScanEvent): Promise<void> {
    const { error } = await this.supabase
      .from('scan_events')
      .insert({ ...scan });
    if (error) throw error;
  }
  async getScanEvents(eventId: string): Promise<ScanEvent[]> {
    const { data, error } = await this.supabase
      .from('scan_events')
      .select('*')
      .eq('event_id', eventId);
    if (error) throw error;
    return data || [];
  }

  // Scan Accounts
  async getScanAccount(accountId: string): Promise<ScanAccount | null> {
    const { data, error } = await this.supabase
      .from('scan_accounts')
      .select('*')
      .eq('id', accountId)
      .single();
    if (error) return null;
    return data;
  }
  async getScanAccountByUsername(eventId: string, username: string): Promise<ScanAccount | null> {
    const { data, error } = await this.supabase
      .from('scan_accounts')
      .select('*')
      .eq('event_id', eventId)
      .eq('username', username)
      .single();
    if (error) return null;
    return data;
  }
  async listScanAccounts(eventId: string): Promise<ScanAccount[]> {
    const { data, error } = await this.supabase
      .from('scan_accounts')
      .select('*')
      .eq('event_id', eventId);
    if (error) throw error;
    return data || [];
  }
  async saveScanAccount(account: ScanAccount): Promise<void> {
    const { error } = await this.supabase
      .from('scan_accounts')
      .upsert({ ...account });
    if (error) throw error;
  }
  async updateScanAccount(accountId: string, patch: Partial<ScanAccount>): Promise<void> {
    const { error } = await this.supabase
      .from('scan_accounts')
      .update(patch)
      .eq('id', accountId);
    if (error) throw error;
  }
  async deleteScanAccount(accountId: string): Promise<void> {
    const { error } = await this.supabase
      .from('scan_accounts')
      .delete()
      .eq('id', accountId);
    if (error) throw error;
  }
  async incrementScanAccountLoginTimestamp(accountId: string, at: Date): Promise<void> {
    // Requires a database function in Supabase
  }
}
