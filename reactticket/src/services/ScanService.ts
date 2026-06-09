import { StorageAdapter } from "../types/adapter.types";
import { ScanEvent, ScanResult } from "../types/scan.types";
import { AuthService } from "./AuthService";
import { IssuedTicket } from "../types/ticket.types";

export class ScanService {
  constructor(private adapter: StorageAdapter, private authService: AuthService) {}

  async checkTicket(payload: string): Promise<{ result: ScanResult, ticket: IssuedTicket | null }> {
    // 1. Verify HMAC
    const parts = payload.split('.');
    if (parts.length !== 4) return { result: "invalid", ticket: null };
    
    const [prefix, eventId, ticketIdPayload, signature] = parts;
    if (prefix !== 'TF1') return { result: "invalid", ticket: null };

    // Verify signature
    const enc = new TextEncoder();
    const keyData = enc.encode(this.authService.getSecret());
    const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    
    const base64Signature = signature.replace(/-/g, "+").replace(/_/g, "/");
    const binarySignature = atob(base64Signature);
    const signatureBuffer = new Uint8Array(binarySignature.length);
    for (let i = 0; i < binarySignature.length; i++) signatureBuffer[i] = binarySignature.charCodeAt(i);
    
    const isValid = await crypto.subtle.verify("HMAC", key, signatureBuffer, enc.encode(`${prefix}.${eventId}.${ticketIdPayload}`));
    if (!isValid) return { result: "invalid", ticket: null };
    
    const ticket = await this.adapter.getTicket(ticketIdPayload);
    if (!ticket) return { result: "invalid", ticket: null };
    if (ticket.status === "used") return { result: "already_used", ticket };
    if (ticket.status === "cancelled") return { result: "cancelled", ticket };
    
    return { result: "admitted", ticket };
  }

  async admitTicket(ticketId: string, accountId: string): Promise<void> {
    await this.adapter.updateTicketStatus(ticketId, "used");
    const account = await this.adapter.getScanAccount(accountId);
    const scanEvent: ScanEvent = {
        id: `scan_${Math.random().toString(36).substring(7)}`,
        ticketId,
        scannedAt: new Date(),
        scannedByAccountId: accountId,
        scannedByAccountName: account ? account.username : "Unknown",
        result: "admitted"
    };
    await this.adapter.saveScanEvent(scanEvent);
  }
}
