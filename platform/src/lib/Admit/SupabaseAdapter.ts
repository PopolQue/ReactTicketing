import { SupabaseClient } from "@supabase/supabase-js";
import type { StorageAdapter, TicketTypeConfig, IssuedTicket, Order, PromoCode, PromoBatch, ScanEvent, ScanAccount } from "reactticket-core";
import { 
  mapDbRowToTicketTypeConfig, 
  mapTicketTypeConfigToRow, 
  mapDbRowToScanAccount, 
  mapScanAccountToRow,
  mapScanAccountPatchToRow,
  mapOrderToRow,
  mapTicketToRow,
  mapScanEventToRow
} from "./mappers";

export class SupabaseAdapter implements StorageAdapter {
  readonly name = "SupabaseAdapter";

  constructor(private supabase: SupabaseClient) {}

  async getTicketTypes(eventId: string): Promise<TicketTypeConfig[]> {
    return Promise.reject(new Error("Not implemented"));
  }

  async saveTicketType(eventId: string, type: TicketTypeConfig): Promise<void> {
    return Promise.reject(new Error("Not implemented"));
  }

  async deleteTicketType(eventId: string, ticketTypeId: string): Promise<void> {
    return Promise.reject(new Error("Not implemented"));
  }

  async createOrder(order: Order): Promise<void> {
    return Promise.reject(new Error("Not implemented"));
  }

  async getOrder(orderId: string): Promise<Order | null> {
    return Promise.reject(new Error("Not implemented"));
  }

  async updateOrderStatus(orderId: string, status: Order["status"]): Promise<void> {
    return Promise.reject(new Error("Not implemented"));
  }

  async getTicket(ticketId: string): Promise<IssuedTicket | null> {
    return Promise.reject(new Error("Not implemented"));
  }

  async getTicketsByOrder(orderId: string): Promise<IssuedTicket[]> {
    return Promise.reject(new Error("Not implemented"));
  }

  async getIssuedTickets(eventId: string): Promise<IssuedTicket[]> {
    return Promise.reject(new Error("Not implemented"));
  }

  async saveTicket(ticket: IssuedTicket): Promise<void> {
    return Promise.reject(new Error("Not implemented"));
  }

  async updateTicketStatus(ticketId: string, status: IssuedTicket["status"]): Promise<void> {
    return Promise.reject(new Error("Not implemented"));
  }

  async deliverTicket(ticketId: string, qrPayload: string): Promise<void> {
    return Promise.reject(new Error("Not implemented"));
  }

  async transferTicket(ticketId: string, toEmail: string, newPersonalization: any): Promise<void> {
    return Promise.reject(new Error("Not implemented"));
  }

  async countIssuedTickets(ticketTypeId: string, eventId: string): Promise<number> {
    return Promise.reject(new Error("Not implemented"));
  }

  async getPromoCode(code: string): Promise<PromoCode | null> {
    return Promise.reject(new Error("Not implemented"));
  }

  async savePromoBatch(batch: PromoBatch): Promise<void> {
    return Promise.reject(new Error("Not implemented"));
  }

  async listPromoBatches(): Promise<PromoBatch[]> {
    return Promise.reject(new Error("Not implemented"));
  }

  async incrementPromoUsage(code: string): Promise<void> {
    return Promise.reject(new Error("Not implemented"));
  }

  async saveScanEvent(scan: ScanEvent): Promise<void> {
    return Promise.reject(new Error("Not implemented"));
  }

  async getScanEvents(eventId: string): Promise<ScanEvent[]> {
    return Promise.reject(new Error("Not implemented"));
  }

  async getScanAccount(accountId: string): Promise<ScanAccount | null> {
    return Promise.reject(new Error("Not implemented"));
  }

  async getScanAccountByUsername(eventId: string, username: string): Promise<ScanAccount | null> {
    return Promise.reject(new Error("Not implemented"));
  }

  async listScanAccounts(eventId: string): Promise<ScanAccount[]> {
    return Promise.reject(new Error("Not implemented"));
  }

  async saveScanAccount(account: ScanAccount): Promise<void> {
    return Promise.reject(new Error("Not implemented"));
  }

  async updateScanAccount(accountId: string, patch: Partial<ScanAccount>): Promise<void> {
    return Promise.reject(new Error("Not implemented"));
  }

  async deleteScanAccount(accountId: string): Promise<void> {
    return Promise.reject(new Error("Not implemented"));
  }

  async incrementScanAccountLoginTimestamp(accountId: string, at: Date): Promise<void> {
    return Promise.reject(new Error("Not implemented"));
  }
}
