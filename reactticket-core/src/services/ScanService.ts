import { StorageAdapter } from "../types/adapter.types";
import { ScanEvent, ScanResult, AnalyticsSummary } from "../types/scan.types";
import { AuthService } from "./AuthService";
import { IssuedTicket } from "../types/ticket.types";
import { ScanSession } from "../types/auth.types";

export class ScanService {
  constructor(private adapter: StorageAdapter, private authService: AuthService) {}

  async validateTicket(payload: string, session: ScanSession, eventId: string): Promise<ScanEvent> {
    // 1. assertScanSession()
    await this.authService.assertScanSession(session.token, eventId);

    let result: ScanResult = "invalid";
    let ticket: IssuedTicket | null = null;
    let ticketIdFromPayload: string | null = null;

    try {
        // 2. Parse payload & 3. Verify HMAC
        const parts = payload.split('.');
        if (parts.length !== 4 || parts[0] !== 'TF1') {
            throw new Error("Invalid payload format");
        }
        
        const [prefix, eventId, ticketId, signature] = parts;
        ticketIdFromPayload = ticketId;
        
        const enc = new TextEncoder();
        const keyData = enc.encode(this.authService.getSecret());
        const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
        
        const base64Signature = signature.replace(/-/g, "+").replace(/_/g, "/");
        const binarySignature = atob(base64Signature);
        const signatureBuffer = new Uint8Array(binarySignature.length);
        for (let i = 0; i < binarySignature.length; i++) signatureBuffer[i] = binarySignature.charCodeAt(i);
        
        const isValid = await crypto.subtle.verify("HMAC", key, signatureBuffer, enc.encode(`${prefix}.${eventId}.${ticketId}`));
        if (!isValid) {
            throw new Error("Invalid signature");
        }

        // 4. Fetch ticket
        ticket = await this.adapter.getTicket(ticketId);
        if (!ticket) {
            throw new Error("Ticket not found");
        }

        // 5. Check status + window
        const now = new Date();
        if (ticket.status === "used") {
            result = "already_used";
        } else if (ticket.status === "cancelled") {
            result = "cancelled";
        } else if (ticket.validFrom && now.getTime() < ticket.validFrom.getTime()) {
            result = "invalid"; // Too early
        } else if (ticket.validUntil && now.getTime() > ticket.validUntil.getTime()) {
            result = "expired";
        } else {
            result = "admitted";
            // 7. Update ticket status
            await this.adapter.updateTicketStatus(ticket.id, "used");
        }
    } catch (e: any) {
        console.error("Ticket validation failed:", e.message);
        result = "invalid";
    }

    // 6. Write ScanEvent
    const scanEvent: ScanEvent = {
        id: `scan_${Math.random().toString(36).substring(7)}`,
        ticketId: ticket ? ticket.id : ticketIdFromPayload || 'unknown',
        scannedAt: new Date(),
        scannedByAccountId: session.accountId,
        scannedByAccountName: session.accountUsername,
        result: result,
        payload: payload,
    };
    await this.adapter.saveScanEvent(scanEvent);

    return scanEvent;
  }

  async getAnalytics(eventId: string): Promise<AnalyticsSummary> {
    const tickets = await this.adapter.getIssuedTickets();
    const eventTickets = tickets; // Assuming filter is done by adapter or not needed for now
    const scans = await this.adapter.getScanEvents(eventId);

    const summary: AnalyticsSummary = {
        totalAdmitted: scans.filter(s => s.result === 'admitted').length,
        totalIssued: eventTickets.length,
        scanVelocity: this._calculateScanVelocity(scans),
        admissionRateByTicketType: {},
        duplicateScanCount: scans.filter(s => s.result === 'already_used').length,
        invalidScanCount: scans.filter(s => s.result === 'invalid').length,
        scansPerAccount: {},
        clockSkewAnomalies: scans.filter(s => s.result === 'clock_skew_anomaly').length,
    };

    // Calculate rates by ticket type
    eventTickets.forEach(t => {
        if (!summary.admissionRateByTicketType[t.ticketTypeId]) {
            summary.admissionRateByTicketType[t.ticketTypeId] = { admitted: 0, total: 0 };
        }
        summary.admissionRateByTicketType[t.ticketTypeId].total++;
        if (t.status === 'used') {
            summary.admissionRateByTicketType[t.ticketTypeId].admitted++;
        }
    });

    // Calculate scans per account
    scans.forEach(s => {
        if (!summary.scansPerAccount[s.scannedByAccountId]) {
            summary.scansPerAccount[s.scannedByAccountId] = { username: s.scannedByAccountName, count: 0 };
        }
        summary.scansPerAccount[s.scannedByAccountId].count++;
    });

    return summary;
  }

  private _calculateScanVelocity(scans: ScanEvent[]): { timestamp: Date; count: number }[] {
    // Group scans by 5-minute intervals for the last hour (simplified)
    const velocity: Record<number, number> = {};
    const now = Date.now();
    const oneHourAgo = now - 3600000;

    scans.filter(s => {
        const date = s.scannedAt instanceof Date ? s.scannedAt : new Date(s.scannedAt);
        return date.getTime() > oneHourAgo;
    }).forEach(s => {
        const date = s.scannedAt instanceof Date ? s.scannedAt : new Date(s.scannedAt);
        const interval = Math.floor(date.getTime() / 300000) * 300000;
        velocity[interval] = (velocity[interval] || 0) + 1;
    });

    return Object.entries(velocity).map(([timestamp, count]) => ({
        timestamp: new Date(parseInt(timestamp)),
        count
    })).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
}
