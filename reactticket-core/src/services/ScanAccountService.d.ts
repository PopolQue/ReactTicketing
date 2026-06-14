import { StorageAdapter } from "../types/adapter.types";
import { ScanAccount } from "../types/scanAccount.types";
export declare class ScanAccountService {
    private adapter;
    constructor(adapter: StorageAdapter);
    private hashPin;
    createAccount(eventId: string, username: string, pin: string, assignedLocation?: string): Promise<ScanAccount>;
    loginLegacyAccount(eventId: string, username: string, pin: string): Promise<boolean>;
    resetPin(accountId: string, newPin: string): Promise<void>;
    deactivate(accountId: string): Promise<void>;
    reactivate(accountId: string): Promise<void>;
    delete(accountId: string): Promise<void>;
    list(eventId: string): Promise<ScanAccount[]>;
}
