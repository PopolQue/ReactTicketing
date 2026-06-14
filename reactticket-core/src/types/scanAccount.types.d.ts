export interface ScanAccount {
    id: string;
    eventId: string;
    username: string;
    pinHash: string;
    pinSalt: string;
    credentialVersion: number;
    active: boolean;
    createdAt: Date;
    createdByAdmin: true;
    lastLoginAt?: Date;
    assignedLocation?: string;
}
export * from './scan.types';
