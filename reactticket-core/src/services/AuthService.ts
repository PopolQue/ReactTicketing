import { ScanSession } from "reactticket-core/types/auth.types";
import { StorageAdapter } from "reactticket-core/types/adapter.types";
import { EventSettings } from "reactticket-core/types/event.types";
import { signToken, verifyToken } from "reactticket-core/utils/crypto";

export class AuthService {
  private keyPromise: Promise<CryptoKey>;

  constructor(private adapter: StorageAdapter, private eventSettings: EventSettings) {
    if (!this.eventSettings || !this.eventSettings.scanSessionSecret) {
        console.error("AuthService initialized without scanSessionSecret", this.eventSettings);
        this.keyPromise = Promise.reject("Missing scanSessionSecret");
    } else {
        this.keyPromise = this.deriveKey(this.eventSettings.scanSessionSecret);
    }
  }

  private async deriveKey(secret: string): Promise<CryptoKey> {
    console.log("Deriving key with secret length:", secret?.length);
    const enc = new TextEncoder();
    try {
        return await crypto.subtle.importKey(
          "raw",
          enc.encode(secret),
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["sign", "verify"]
        );
    } catch (e) {
        console.error("Failed to import key", e);
        throw e;
    }
  }

  getSecret(): string {
    return this.eventSettings.scanSessionSecret;
  }

  async verifyAdminKey(passphrase: string): Promise<boolean> {
    const keyString = this.eventSettings.adminKey;
    const parts = keyString.split('$');
    if (parts.length !== 4 || parts[0] !== 'pbkdf2-sha256') {
        console.error("Invalid adminKey format. Expected: pbkdf2-sha256$<iterations>$<salt>$<hash>");
        return false;
    }
    const iterations = parseInt(parts[1]);
    const salt = this._decode(parts[2]);
    const hashToCompare = this._decode(parts[3]);

    const providedHashBytes = await this.hashWithSalt(passphrase, salt, iterations);

    if (providedHashBytes.length !== hashToCompare.length) return false;
    
    // Constant-time comparison
    let diff = 0;
    for (let i = 0; i < providedHashBytes.length; i++) {
        diff |= providedHashBytes[i] ^ hashToCompare[i];
    }
    return diff === 0;
  }

  private async hashWithSalt(passphrase: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
    const enc = new TextEncoder();
    const passphraseBuffer = enc.encode(passphrase);
    const baseKey = await crypto.subtle.importKey("raw", passphraseBuffer as any, "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({
      name: "PBKDF2",
      salt: salt as any,
      iterations: iterations,
      hash: "SHA-256"
    }, baseKey, 256);
    return new Uint8Array(bits);
  }

  private _decode(base64: string): Uint8Array {
    const binary_string = atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
  }

  async assertScanSession(token: string, eventId: string): Promise<ScanSession> {
    const key = await this.keyPromise;
    const isValid = await verifyToken(token, key);
    if (!isValid) throw new Error("Invalid token signature");

    const [_, payloadB64] = token.split(".");
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")));

    if (payload.exp < Date.now()) throw new Error("Token expired");
    if (payload.evt !== eventId) throw new Error(`Token event mismatch: payload=${payload.evt}, provided=${eventId}`);

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

  async loginScanAccount(eventId: string, username: string, pin: string): Promise<ScanSession> {
    const account = await this.adapter.getScanAccountByUsername(eventId, username);
    if (!account || !account.active) {
        console.error("Account not found or inactive:", username);
        throw new Error("Invalid credentials");
    }

    const saltBuffer = this._decode(account.pinSalt);
    const providedHash = await this.hashPin(pin, saltBuffer);
    
    if (providedHash !== account.pinHash) {
        console.error("PIN hash mismatch");
        throw new Error("Invalid credentials");
    }

    const issuedAt = Date.now();
    const expiresAt = issuedAt + (this.eventSettings.scanSessionTTLHours || 8) * 3600000;
    const header = { alg: "HS256", typ: "JWT" };
    const sessionPayload = {
      sub: account.id,
      usr: account.username,
      evt: eventId,
      ver: account.credentialVersion,
      iat: issuedAt,
      exp: expiresAt,
      role: 'scan',
    };
    
    const key = await this.keyPromise;
    console.log("Signing token with key object:", key);
    const token = await signToken(header, sessionPayload, key);
    
    await this.adapter.incrementScanAccountLoginTimestamp(account.id, new Date(issuedAt));

    const session: ScanSession = {
        accountId: account.id,
        accountUsername: account.username,
        eventId: eventId,
        assignedLocation: account.assignedLocation,
        credentialVersion: account.credentialVersion,
        issuedAt: issuedAt,
        expiresAt: expiresAt,
        token,
        role: 'scan',
    };
    return session;
  }

  async hashPin(pin: string, salt: Uint8Array): Promise<string> {
    const hashBytes = await this.hashWithSalt(pin, salt, 100000);
    return btoa(String.fromCharCode(...hashBytes));
  }

  async clearSession(): Promise<void> {
    // In a real app this would call a backend endpoint to invalidate the token if using a blacklist.
    // For now, we just clear it from the context by dispatching an action in the hook.
    // The hook is responsible for clearing sessionStorage.
    return Promise.resolve();
  }
}
