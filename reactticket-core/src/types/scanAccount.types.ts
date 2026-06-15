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
}

export * from './scan.types';
