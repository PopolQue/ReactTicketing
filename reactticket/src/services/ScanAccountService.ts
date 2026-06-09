import { StorageAdapter } from "../types/adapter.types";
import { ScanAccount } from "../types/scanAccount.types";

export class ScanAccountService {
  constructor(private adapter: StorageAdapter) {}

  private async hashPin(pin: string, salt: Uint8Array): Promise<string> {
    const enc = new TextEncoder();
    const pinBuffer = enc.encode(pin);
    const baseKey = await crypto.subtle.importKey("raw", pinBuffer, "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({
      name: "PBKDF2",
      salt: salt as any,
      iterations: 100000,
      hash: "SHA-256"
    }, baseKey, 256);
    
    // Convert to Base64
    const hashArray = new Uint8Array(bits);
    return btoa(String.fromCharCode(...hashArray));
  }

  async createAccount(eventId: string, username: string, pin: string, assignedLocation?: string): Promise<ScanAccount> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const pinHash = await this.hashPin(pin, salt);
    
    console.log("Created Account Hash:", pinHash);
    console.log("Created Account Salt:", btoa(String.fromCharCode(...salt)));
    
    const account: ScanAccount = {
        id: `acc_${Math.random().toString(36).substring(7)}`,
        eventId,
        username,
        pinHash,
        pinSalt: btoa(String.fromCharCode(...salt)),
        credentialVersion: 1,
        active: true,
        createdAt: new Date(),
        createdByAdmin: true,
        assignedLocation
    };
    await this.adapter.saveScanAccount(account);
    return account;
  }
}
