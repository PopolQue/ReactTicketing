export type ScanResult =
  | "admitted"
  | "already_used"
  | "invalid"
  | "expired"
  | "cancelled"
  | "clock_skew_anomaly";

export interface ScanEvent {
  id: string;
  ticketId: string;
  scannedAt: Date;
  scannedByAccountId: string;
  scannedByAccountName: string;
  result: ScanResult;
  clockSkewSeconds?: number;
  location?: string;
}
