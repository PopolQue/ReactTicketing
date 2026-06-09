import { ScanSession } from "../types/auth.types";
import { StorageAdapter } from "../types/adapter.types";
import { verifyToken } from "../utils/crypto";

// Need a way to convert secret to CryptoKey in service if needed? 
// Actually, the current crypto.ts takes CryptoKey as input, not secret.
// I need to import the key generation logic or handle it. 
// Let's import a helper or adjust crypto.ts to take string secret? 
// Actually, let's keep it clean. Let's assume the constructor takes secret and we derive key once.

export class AuthService {
  private keyPromise: Promise<CryptoKey>;

  constructor(private adapter: StorageAdapter, private secret?: string) {
    if (secret) {
      this.keyPromise = this.deriveKey(secret);
    } else {
      this.keyPromise = Promise.reject("Secret not provided");
    }
  }

  private async deriveKey(secret: string): Promise<CryptoKey> {
    const enc = new TextEncoder();
    return crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );
  }

  getSecret(): string {
    return this.secret || '';
  }

  async assertScanSession(token: string, eventId: string): Promise<ScanSession> {
    const key = await this.keyPromise;
    const isValid = await verifyToken(token, key);
    if (!isValid) throw new Error("Invalid token signature");

    const [_, payloadB64] = token.split(".");
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")));

    if (payload.exp < Date.now()) throw new Error("Token expired");
    if (payload.evt !== eventId) throw new Error("Token event mismatch");

    const account = await this.adapter.getScanAccount(payload.sub);
    if (!account || !account.active || account.credentialVersion !== payload.ver) {
      throw new Error("Account invalid or credential stale");
    }

    return {
      accountId: payload.sub,
      accountUsername: payload.usr,
      eventId: payload.evt,
      assignedLocation: account.assignedLocation,
      credentialVersion: payload.ver,
      issuedAt: payload.iat,
      expiresAt: payload.exp,
      token,
      role: 'scan'
    };
  }
// ...

  async loginScanAccount(eventId: string, username: string, pin: string): Promise<ScanSession> {
    const account = await this.adapter.getScanAccountByUsername(eventId, username);
    if (!account || !account.active) {
        console.error("Account not found or inactive:", username);
        throw new Error("Invalid credentials");
    }

    // Re-derive hash
    const saltBuffer = Uint8Array.from(atob(account.pinSalt), c => c.charCodeAt(0));
    const providedHash = await this.hashPin(pin, saltBuffer);
    
    console.log("Account PIN Hash:", account.pinHash);
    console.log("Provided PIN Hash:", providedHash);

    if (providedHash !== account.pinHash) {
        console.error("PIN hash mismatch");
        throw new Error("Invalid credentials");
    }

    // Create session (placeholder for actual signing logic)
    const session: ScanSession = {
        accountId: account.id,
        accountUsername: account.username,
        eventId,
        role: 'scan',
        credentialVersion: account.credentialVersion,
        issuedAt: Date.now(),
        expiresAt: Date.now() + 8 * 3600000,
        token: "signed_token"
    };
    return session;
  }

  // Need to make hashPin public or static for reuse, or just duplicate/share it.
  // Actually, I'll move it to crypto.ts for better reuse.
  // For now, I'll just expose it here too.
  async hashPin(pin: string, salt: Uint8Array): Promise<string> {
    const enc = new TextEncoder();
    const pinBuffer = enc.encode(pin);
    const baseKey = await crypto.subtle.importKey("raw", pinBuffer, "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({
      name: "PBKDF2",
      salt: salt as any,
      iterations: 100000,
      hash: "SHA-256"
    }, baseKey, 256);
    
    const hashArray = new Uint8Array(bits);
    return btoa(String.fromCharCode(...hashArray));
  }

  async clearSession(): Promise<void> {
    // Clear from sessionStorage
    throw new Error("Not implemented");
  }
}
