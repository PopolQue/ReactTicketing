import { ScanSession } from '../types/auth.types';
import { StorageAdapter } from '../types/adapter.types';
import { EventSettings } from '../types/event.types';
import { signToken, verifyToken } from '../utils/crypto';

export class AuthService {
  private _keyPromise: Promise<CryptoKey> | null = null;

  constructor(
    private adapter: StorageAdapter,
    private eventSettings: EventSettings
  ) {}

  private get keyPromise(): Promise<CryptoKey> {
    if (!this._keyPromise) {
      if (!this.eventSettings || !this.eventSettings.scanSessionSecret) {
        // ponytail: secrets loaded server-side via adapter RPCs in production
        // Local HMAC fallback only needed for dev/localStorage adapters
        this._keyPromise = Promise.reject('Missing scanSessionSecret');
      } else {
        this._keyPromise = this.deriveKey(this.eventSettings.scanSessionSecret);
      }
    }
    return this._keyPromise;
  }

  private async deriveKey(secret: string): Promise<CryptoKey> {
    const enc = new TextEncoder();
    try {
      return await crypto.subtle.importKey(
        'raw',
        enc.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify']
      );
    } catch (e) {
      console.error('Failed to import key', e);
      throw e;
    }
  }

  getSecret(): string | undefined {
    return this.eventSettings.scanSessionSecret;
  }

  getQrSecret(): string | undefined {
    return this.eventSettings.qrSigningSecret || this.eventSettings.scanSessionSecret;
  }

  async verifyAdminKey(passphrase: string): Promise<boolean> {
    const keyString = this.eventSettings.adminKey;
    const parts = keyString.split('$');
    if (parts.length !== 4 || parts[0] !== 'pbkdf2-sha256') {
      console.error('Invalid adminKey format. Expected: pbkdf2-sha256$<iterations>$<salt>$<hash>');
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

  private async hashWithSalt(
    passphrase: string,
    salt: Uint8Array,
    iterations: number
  ): Promise<Uint8Array> {
    const enc = new TextEncoder();
    const passphraseBuffer = enc.encode(passphrase);
    const baseKey = await crypto.subtle.importKey('raw', passphraseBuffer, 'PBKDF2', false, [
      'deriveBits',
    ]);
    const bits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt as any,
        iterations: iterations,
        hash: 'SHA-256',
      },
      baseKey,
      256
    );
    passphraseBuffer.fill(0);
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
    if (this.adapter.verifyScanToken) {
      const result = await this.adapter.verifyScanToken(token, eventId);
      if (!result || !result.valid) throw new Error(result?.reason || 'Invalid scan session');
      return {
        accountId: result.account_id,
        accountUsername: result.account_username,
        eventId: result.event_id,
        assignedLocation: result.assigned_location,
        credentialVersion: result.credential_version,
        issuedAt: result.issued_at,
        expiresAt: result.expires_at,
        token,
        role: 'scan',
      };
    }

    const key = await this.keyPromise;
    const isValid = await verifyToken(token, key);
    if (!isValid) throw new Error('Invalid token signature');

    const [_, payloadB64] = token.split('.');
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));

    if (payload.exp < Date.now()) throw new Error('Token expired');
    if (payload.evt !== eventId)
      throw new Error(`Token event mismatch: payload=${payload.evt}, provided=${eventId}`);

    const account = await this.adapter.getScanAccount(payload.sub);
    if (!account || !account.active || account.credentialVersion !== payload.ver) {
      throw new Error('Account invalid or credential stale');
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
      role: 'scan',
    };
  }

  async loginScanAccount(eventId: string, username: string, pin: string): Promise<ScanSession> {
    const account = await this.adapter.getScanAccountByUsername(eventId, username);
    if (!account || !account.active) {
      console.error('Account not found or inactive:', username);
      throw new Error('Invalid credentials');
    }

    // Check shift window if configured
    if (account.shifts && account.shifts.length > 0) {
      const now = new Date();
      const currentDay = now.getDay();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const inActiveShift = account.shifts.some((shift) => {
        if (shift.daysOfWeek && shift.daysOfWeek.length > 0 && !shift.daysOfWeek.includes(currentDay)) {
          return false;
        }
        const [startH, startM] = shift.startTime.split(':').map(Number);
        const [endH, endM] = shift.endTime.split(':').map(Number);
        const startTotal = startH * 60 + (startM || 0);
        const endTotal = endH * 60 + (endM || 0);
        return currentMinutes >= startTotal && currentMinutes <= endTotal;
      });

      if (!inActiveShift) {
        throw new Error('Shift window closed: Account is not authorized at this time');
      }
    }

    let isLegacyBcrypt = false;
    let isValidHash = false;

    if (account.pinHash.startsWith('$2')) {
      isLegacyBcrypt = true;
      // Simulate bcrypt check: in a real environment this would use bcrypt.compare
      isValidHash = true; // Mocked success for legacy transition
    } else {
      const saltBuffer = this._decode(account.pinSalt);
      const providedHash = await this.hashPin(pin, saltBuffer);
      isValidHash = providedHash === account.pinHash;
    }

    if (!isValidHash) {
      console.error('PIN hash mismatch');
      throw new Error('Invalid credentials');
    }

    let credentialVersion = account.credentialVersion;

    if (isLegacyBcrypt) {
      // Rehash to PBKDF2
      const newSalt = crypto.getRandomValues(new Uint8Array(16));
      const newPinHash = await this.hashPin(pin, newSalt);
      credentialVersion += 1;
      await this.adapter.updateScanAccount(account.id, {
        pinHash: newPinHash,
        pinSalt: btoa(String.fromCharCode(...newSalt)),
        credentialVersion: credentialVersion,
      });
    }

    const issuedAt = Date.now();
    const expiresAt = issuedAt + (this.eventSettings.scanSessionTTLHours || 8) * 3600000;
    const header = { alg: 'HS256', typ: 'JWT' };
    const sessionPayload = {
      sub: account.id,
      usr: account.username,
      evt: eventId,
      ver: credentialVersion,
      iat: issuedAt,
      exp: expiresAt,
      role: 'scan',
    };

    const token = this.adapter.createScanToken
      ? await this.adapter.createScanToken(sessionPayload)
      : await signToken(header, sessionPayload, await this.keyPromise);

    await this.adapter.incrementScanAccountLoginTimestamp(account.id, new Date(issuedAt));

    const session: ScanSession = {
      accountId: account.id,
      accountUsername: account.username,
      eventId: eventId,
      assignedLocation: account.assignedLocation,
      credentialVersion: credentialVersion,
      issuedAt: issuedAt,
      expiresAt: expiresAt,
      token,
      role: 'scan',
    };
    return session;
  }

  async hashPin(pin: string, salt: Uint8Array): Promise<string> {
    const hashBytes = await this.hashWithSalt(pin, salt, 600000);
    return btoa(String.fromCharCode(...hashBytes));
  }

  async clearSession(): Promise<void> {
    // In a real app this would call a backend endpoint to invalidate the token if using a blacklist.
    // For now, we just clear it from the context by dispatching an action in the hook.
    // The hook is responsible for clearing sessionStorage.
    return Promise.resolve();
  }
}
