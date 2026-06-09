import { describe, it, expect, vi } from 'vitest';
import { AuthService } from '../services/AuthService';
import { StorageAdapter } from '../types/adapter.types';
import { signToken } from '../utils/crypto';
import * as crypto from 'node:crypto'; // For generating a CryptoKey

// Helper to generate a key
async function getCryptoKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

describe('AuthService', () => {
  const mockAdapter = {
    getScanAccount: vi.fn().mockResolvedValue({
      id: 'acc1',
      active: true,
      credentialVersion: 1
    }),
  } as unknown as StorageAdapter;

  const secret = 'super-secret-key-that-is-at-least-32-chars-long!!!!!!!!!!';

  it('should successfully verify a valid session token', async () => {
    const authService = new AuthService(mockAdapter, secret);
    const key = await getCryptoKey(secret);
    
    const now = Date.now();
    const payload = {
      sub: 'acc1',
      usr: 'test-user',
      evt: 'e1',
      ver: 1,
      iat: now - 1000,
      exp: now + 3600000 // 1 hour expiry
    };
    
    const token = await signToken({ alg: 'HS256', typ: 'TF-SCAN' }, payload, key);
    
    const session = await authService.assertScanSession(token, 'e1');
    
    expect(session.accountId).toBe('acc1');
    expect(session.accountUsername).toBe('test-user');
  });

  it('should throw an error for a token signed with the wrong secret', async () => {
    const authService = new AuthService(mockAdapter, secret);
    const wrongKey = await getCryptoKey('wrong-secret-!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    
    const now = Date.now();
    const payload = { sub: 'acc1', usr: 'test', evt: 'e1', ver: 1, iat: now, exp: now + 3600 };
    
    const token = await signToken({ alg: 'HS256', typ: 'TF-SCAN' }, payload, wrongKey);
    
    await expect(authService.assertScanSession(token, 'e1')).rejects.toThrow("Invalid token signature");
  });
});
