export interface ScanSession {
  accountId: string;
  accountUsername: string;
  eventId: string;
  assignedLocation?: string;
  credentialVersion: number;
  issuedAt: number;
  expiresAt: number;
  token: string;
  role: 'scan';
}

export interface AdminSession {
  isAdmin: true;
  role: 'admin';
}
