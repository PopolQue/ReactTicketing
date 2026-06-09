import { describe, it, expect } from 'vitest';
import { signToken, verifyToken } from '../utils/crypto';

describe('Crypto Utilities', () => {
  it('should sign and verify a token', async () => {
    const payload = { sub: '1', usr: 'test', evt: 'e1', iat: 1, exp: 9999999999999 };
    const secret = 'super-secret-key-that-is-at-least-32-chars-long-!!!';
    const token = await signToken(payload, secret);
    const verified = await verifyToken(token, secret);
    expect(verified).toEqual(payload);
  });
});
