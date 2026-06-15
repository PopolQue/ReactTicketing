export type ScanResult =
  | "admitted"
  | "already_used"
  | "invalid"
  | "expired"
  | "cancelled"
  | "clock_skew_anomaly";

export interface ScanEvent {
  readonly id: string;
  readonly ticketId: string;
  readonly scannedAt: Date;
  readonly scannedByAccountId: string;
  readonly scannedByAccountName: string;
  readonly result: ScanResult;
  readonly clockSkewSeconds?: number;
  readonly location?: string;
  readonly payload?: string;
}

export interface AnalyticsSummary {
  totalAdmitted: number;
  totalIssued: number;
  scanVelocity: { timestamp: Date; count: number }[];
  admissionRateByTicketType: Record<string, { admitted: number; total: number }>;
  duplicateScanCount: number;
  invalidScanCount: number;
  scansPerAccount: Record<string, { username: string; count: number }>;
  clockSkewAnomalies: number;
}
