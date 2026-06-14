export type ScanResult = "admitted" | "already_used" | "invalid" | "expired" | "cancelled" | "clock_skew_anomaly";
export interface ScanEvent {
    id: string;
    ticketId: string;
    scannedAt: Date;
    scannedByAccountId: string;
    scannedByAccountName: string;
    result: ScanResult;
    clockSkewSeconds?: number;
    location?: string;
    payload?: string;
}
export interface AnalyticsSummary {
    totalAdmitted: number;
    totalIssued: number;
    scanVelocity: {
        timestamp: Date;
        count: number;
    }[];
    admissionRateByTicketType: Record<string, {
        admitted: number;
        total: number;
    }>;
    duplicateScanCount: number;
    invalidScanCount: number;
    scansPerAccount: Record<string, {
        username: string;
        count: number;
    }>;
    clockSkewAnomalies: number;
}
