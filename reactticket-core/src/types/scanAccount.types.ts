export interface ScanAccount {
  readonly id: string;
  readonly eventId: string;
  readonly username: string;
  readonly pinHash: string;
  readonly pinSalt: string;
  readonly credentialVersion: number;
  readonly active: boolean;
  readonly createdAt: Date;
  readonly createdByAdmin: true;
  readonly lastLoginAt?: Date;
  readonly assignedLocation?: string;
  readonly shifts?: ScanShift[];
}

export interface ScanShift {
  readonly startTime: string; // "HH:mm" 24h format
  readonly endTime: string;   // "HH:mm" 24h format
  readonly daysOfWeek?: number[]; // 0=Sunday, 1=Monday...
}

export * from './scan.types';
