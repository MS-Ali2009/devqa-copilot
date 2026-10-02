import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { signSession, verifySession } from '@/lib/auth/jwt';

describe('Authentication Utilities', () => {
  const originalEnv = { ...process.env };
  const TEST_SECRET = 'this-is-a-secure-test-session-secret-that-is-at-least-32-chars-long';

  beforeEach(() => {
    process.env = { ...originalEnv, SESSION_SECRET: TEST_SECRET };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Password Hashing (bcryptjs)', () => {
    it('hashes plaintext passwords and verifies correctly', async () => {
      const plaintext = 'SuperSecret123!';
      const hash = await hashPassword(plaintext);

      expect(hash).not.toBe(plaintext);
      expect(hash.startsWith('$2')).toBe(true);

      const isValid = await verifyPassword(plaintext, hash);
      expect(isValid).toBe(true);

      const isInvalid = await verifyPassword('WrongPassword', hash);
      expect(isInvalid).toBe(false);
    });

    it('returns false for empty password or hash', async () => {
      expect(await verifyPassword('', 'somehash')).toBe(false);
      expect(await verifyPassword('password', '')).toBe(false);
    });
  });

  describe('JWT Session Tokens (jose)', () => {
    it('signs and verifies 7-day session token', async () => {
      const payload = {
        userId: 'user-uuid-1234',
        email: 'developer@example.com',
        role: 'owner' as const,
      };

      const token = await signSession(payload);
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);

      const verified = await verifySession(token);
      expect(verified).not.toBeNull();
      expect(verified?.userId).toBe('user-uuid-1234');
      expect(verified?.email).toBe('developer@example.com');
      expect(verified?.role).toBe('owner');
    });

    it('throws error when SESSION_SECRET is missing or shorter than 32 chars', async () => {
      delete process.env.SESSION_SECRET;

      await expect(
        signSession({ userId: 'u1', email: 'test@example.com', role: 'user' })
      ).rejects.toThrow('SESSION_SECRET must be set and at least 32 characters long');

      process.env.SESSION_SECRET = 'short-secret';
      await expect(
        signSession({ userId: 'u1', email: 'test@example.com', role: 'user' })
      ).rejects.toThrow('SESSION_SECRET must be set and at least 32 characters long');
    });

    it('rejects tampered tokens', async () => {
      const token = await signSession({
        userId: 'user-1',
        email: 'test@example.com',
        role: 'user',
      });

      const tampered = token.slice(0, -5) + 'xxxxx';
      const verified = await verifySession(tampered);
      expect(verified).toBeNull();
    });

    it('rejects invalid or empty token inputs', async () => {
      expect(await verifySession('')).toBeNull();
      expect(await verifySession('not.a.valid.jwt')).toBeNull();
    });
  });
});
