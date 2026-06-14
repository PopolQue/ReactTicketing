import { SupabaseClient } from "@supabase/supabase-js";
import type { StorageAdapter, TicketTypeConfig, IssuedTicket, Order, PromoCode, PromoBatch, ScanEvent, ScanAccount } from "reactticket-core";
import { 
  mapDbRowToTicketTypeConfig, 
  mapTicketTypeConfigToRow, 
  mapDbRowToScanAccount, 
  mapScanAccountToRow,
  mapScanAccountPatchToRow,
  mapDbRowToOrder,
  mapOrderToRow,
  mapDbRowToTicket,
  mapTicketToRow,
  mapDbRowToScanEvent,
  mapScanEventToRow,
  mapDbRowToPromoBatch,
  mapPromoBatchToRow
} from "./mappers";

export class SupabaseAdapter implements StorageAdapter {
  readonly name = "SupabaseAdapter";

  constructor(private supabase: SupabaseClient) {}

  // Ticket Types
  async getTicketTypes(eventId: string): Promise<TicketTypeConfig[]> {
    const { data, error } = await this.supabase.from("ticket_types").select("*").eq("event_id", eventId).order("id");
    if (error) throw error;
    return (data || []).map(mapDbRowToTicketTypeConfig);
  }

  async saveTicketType(eventId: string, type: TicketTypeConfig): Promise<void> {
    const { error } = await this.supabase.from("ticket_types").upsert(mapTicketTypeConfigToRow(eventId, type));
    if (error) throw error;
  }

  async deleteTicketType(eventId: string, ticketTypeId: string): Promise<void> {
    const { error } = await this.supabase.from("ticket_types").delete().eq("id", ticketTypeId).eq("event_id", eventId);
    if (error) throw error;
  }

  // Orders
  async createOrder(order: Order): Promise<void> {
    const { error } = await this.supabase.from("orders").insert(mapOrderToRow(order));
    if (error) throw error;
  }

  async getOrder(orderId: string): Promise<Order | null> {
    const { data, error } = await this.supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return mapDbRowToOrder(data);
  }

  async updateOrderStatus(orderId: string, status: Order["status"]): Promise<void> {
    const { error } = await this.supabase.from("orders").update({ status }).eq("id", orderId);
    if (error) throw error;
  }

  // Tickets
  async getTicket(ticketId: string): Promise<IssuedTicket | null> {
    const { data, error } = await this.supabase.from("tickets").select("*").eq("id", ticketId).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return mapDbRowToTicket(data);
  }

  async getTicketsByOrder(orderId: string): Promise<IssuedTicket[]> {
    const { data, error } = await this.supabase.from("tickets").select("*").eq("order_id", orderId);
    if (error) throw error;
    return (data || []).map(mapDbRowToTicket);
  }

  async getIssuedTickets(eventId: string): Promise<IssuedTicket[]> {
    const { data, error } = await this.supabase.from("tickets").select("*").eq("event_id", eventId);
    if (error) throw error;
    return (data || []).map(mapDbRowToTicket);
  }

  async saveTicket(ticket: IssuedTicket): Promise<void> {
    const { error } = await this.supabase.from("tickets").upsert(mapTicketToRow(ticket));
    if (error) throw error;
  }

  async saveTickets(tickets: IssuedTicket[]): Promise<void> {
    if (!tickets.length) return;
    const { error } = await this.supabase.from("tickets").upsert(tickets.map(mapTicketToRow));
    if (error) throw error;
  }

  async updateTicketStatus(ticketId: string, status: IssuedTicket["status"]): Promise<void> {
    const { error } = await this.supabase.from("tickets").update({ status }).eq("id", ticketId);
    if (error) throw error;
  }

  async deliverTicket(ticketId: string, qrPayload: string): Promise<void> {
    const { error } = await this.supabase.from("tickets").update({ status: "delivered", qr_payload: qrPayload }).eq("id", ticketId);
    if (error) throw error;
  }

  async transferTicket(ticketId: string, toEmail: string, newPersonalization: any): Promise<void> {
    const { data: ticket, error: getErr } = await this.supabase.from("tickets").select("*").eq("id", ticketId).single();
    if (getErr) throw getErr;
    
    const history = ticket.transfer_history || [];
    history.push({
      fromEmail: ticket.personalization?.email,
      toEmail,
      at: new Date().toISOString()
    });
    
    const { error: updErr } = await this.supabase.from("tickets").update({
      personalization: newPersonalization,
      transfer_history: history,
      buyer_email: toEmail
    }).eq("id", ticketId);
    if (updErr) throw updErr;
  }

  async countIssuedTickets(ticketTypeId: string, eventId: string): Promise<number> {
    const { data, error } = await this.supabase.from("ticket_types").select("sold_count").eq("id", ticketTypeId).maybeSingle();
    if (error) throw error;
    return data?.sold_count || 0;
  }

  // Promos
  async getPromoCode(code: string): Promise<PromoCode | null> {
    const batches = await this.listPromoBatches();
    for (const batch of batches) {
      const found = batch.codes.find(c => c.code === code);
      if (found) return found;
    }
    return null;
  }

  async savePromoBatch(batch: PromoBatch): Promise<void> {
    const { error } = await this.supabase.from("promo_batches").upsert(mapPromoBatchToRow(batch));
    if (error) throw error;
  }

  async listPromoBatches(): Promise<PromoBatch[]> {
    const { data, error } = await this.supabase.from("promo_batches").select("*");
    if (error) throw error;
    return (data || []).map(mapDbRowToPromoBatch);
  }

  async incrementPromoUsage(code: string): Promise<void> {
    const { error } = await this.supabase.rpc("increment_promo_usage", { p_code: code });
    if (error) throw error;
  }

  // Scans
  async saveScanEvent(scan: ScanEvent): Promise<void> {
    const { error } = await this.supabase.from("scan_events").insert(mapScanEventToRow(scan));
    if (error) throw error;
  }

  async getScanEvents(eventId: string): Promise<ScanEvent[]> {
    const { data, error } = await this.supabase
      .from("scan_events")
      .select("*, tickets!inner(event_id)")
      .eq("tickets.event_id", eventId);
    if (error) throw error;
    return (data || []).map(mapDbRowToScanEvent);
  }

  async getScanAccount(accountId: string): Promise<ScanAccount | null> {
    const { data, error } = await this.supabase.from("scan_accounts").select("*").eq("id", accountId).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return mapDbRowToScanAccount(data);
  }

  async getScanAccountByUsername(eventId: string, username: string): Promise<ScanAccount | null> {
    const { data, error } = await this.supabase.from("scan_accounts").select("*").eq("event_id", eventId).eq("username", username).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return mapDbRowToScanAccount(data);
  }

  async listScanAccounts(eventId: string): Promise<ScanAccount[]> {
    const { data, error } = await this.supabase.from("scan_accounts").select("*").eq("event_id", eventId);
    if (error) throw error;
    return (data || []).map(mapDbRowToScanAccount);
  }

  async saveScanAccount(account: ScanAccount): Promise<void> {
    const { error } = await this.supabase.from("scan_accounts").upsert(mapScanAccountToRow(account));
    if (error) throw error;
  }

  async updateScanAccount(accountId: string, patch: Partial<ScanAccount>): Promise<void> {
    const { error } = await this.supabase.from("scan_accounts").update(mapScanAccountPatchToRow(patch)).eq("id", accountId);
    if (error) throw error;
  }

  async deleteScanAccount(accountId: string): Promise<void> {
    const { error } = await this.supabase.from("scan_accounts").delete().eq("id", accountId);
    if (error) throw error;
  }

  async incrementScanAccountLoginTimestamp(accountId: string, at: Date): Promise<void> {
    const { error } = await this.supabase.from("scan_accounts").update({ last_login_at: at.toISOString() }).eq("id", accountId);
    if (error) throw error;
  }
}
