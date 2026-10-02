import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryRateLimiter, checkRateLimit } from '@/lib/security/rate-limiter';

describe('Rate Limiter', () => {
  let limiter: InMemoryRateLimiter;

  beforeEach(() => {
    limiter = new InMemoryRateLimiter();
  });

  it('allows requests within the limit', () => {
    const ip = '192.168.1.1';
    const limit = 5;

    for (let i = 0; i < limit; i++) {
      const res = limiter.check(ip, limit, 60000);
      expect(res.allowed).toBe(true);
      expect(res.remaining).toBe(limit - 1 - i);
    }
  });

  it('blocks requests exceeding the limit', () => {
    const ip = '10.0.0.1';
    const limit = 3;

    for (let i = 0; i < limit; i++) {
      limiter.check(ip, limit, 60000);
    }

    const blocked = limiter.check(ip, limit, 60000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.resetSeconds).toBeGreaterThan(0);
  });

  it('handles empty or malformed identifier gracefully by falling back to unknown', () => {
    const res = limiter.check('', 10, 60000);
    expect(res.allowed).toBe(true);

    // @ts-expect-error test non-string runtime guard
    const resNull = limiter.check(null, 10, 60000);
    expect(resNull.allowed).toBe(true);
  });

  it('supports custom provider via checkRateLimit wrapper', () => {
    const mockProvider = {
      check: () => ({
        allowed: false,
        limit: 10,
        remaining: 0,
        resetSeconds: 42,
      }),
    };

    const res = checkRateLimit('127.0.0.1', 10, 60000, mockProvider);
    expect(res.allowed).toBe(false);
    expect(res.resetSeconds).toBe(42);
  });
});
