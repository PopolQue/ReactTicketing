import { ScanSession } from "../types/auth.types";
import { StorageAdapter } from "../types/adapter.types";
import { EventSettings } from "../types/event.types";
export declare class AuthService {
    private adapter;
    private eventSettings;
    private _keyPromise;
    constructor(adapter: StorageAdapter, eventSettings: EventSettings);
    private get keyPromise();
    private deriveKey;
    getSecret(): string;
    getQrSecret(): string;
    verifyAdminKey(passphrase: string): Promise<boolean>;
    private hashWithSalt;
    private _decode;
    assertScanSession(token: string, eventId: string): Promise<ScanSession>;
    loginScanAccount(eventId: string, username: string, pin: string): Promise<ScanSession>;
    hashPin(pin: string, salt: Uint8Array): Promise<string>;
    clearSession(): Promise<void>;
}
