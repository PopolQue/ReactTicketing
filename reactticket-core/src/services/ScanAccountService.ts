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

  async resetPin(accountId: string, newPin: string): Promise<void> {
    const account = await this.adapter.getScanAccount(accountId);
    if (!account) throw new Error("Account not found");

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const pinHash = await this.hashPin(newPin, salt);

    await this.adapter.updateScanAccount(accountId, {
        pinHash,
        pinSalt: btoa(String.fromCharCode(...salt)),
        credentialVersion: account.credentialVersion + 1
    });
  }

  async deactivate(accountId: string): Promise<void> {
    await this.adapter.updateScanAccount(accountId, { active: false });
  }

  async reactivate(accountId: string): Promise<void> {
    await this.adapter.updateScanAccount(accountId, { active: true });
  }

  async delete(accountId: string): Promise<void> {
    await this.adapter.deleteScanAccount(accountId);
  }

  async list(eventId: string): Promise<ScanAccount[]> {
    const accounts = await this.adapter.listScanAccounts(eventId);
    // Never return pinHash or pinSalt in the list
    return accounts.map(({ pinHash, pinSalt, ...rest }) => rest as ScanAccount);
  }
}
