/**
 * Rate Limiter Abstraction
 *
 * ⚠️  IMPORTANT SECURITY NOTICE:
 * The default InMemoryRateLimiter is suitable for LOCAL DEVELOPMENT ONLY.
 *
 * In Vercel serverless deployments:
 * - Each serverless function instance has its own memory space
 * - Multiple instances run in parallel across regions and cold starts
 * - The in-memory Map is NOT shared between instances
 * - Therefore, in-memory rate limiting is NOT reliable protection in production
 *
 * For production abuse protection, one of the following MUST be used:
 * 1. Vercel Deployment Protection / Vercel Authentication (recommended for personal MVP)
 *    https://vercel.com/docs/security/deployment-protection
 * 2. A distributed rate limiter backed by Redis/Upstash
 *    (see RateLimiterProvider interface below for future integration)
 *
 * The in-memory limiter is kept as a fallback for:
 * - Local development (single process)
 * - Basic loop-prevention in cases where multiple requests arrive at the same instance
 * - A foundation for unit testing rate-limit behavior
 */

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

/**
 * Abstraction interface for rate limiter providers.
 * Implement this to add a distributed provider (e.g., Upstash Redis).
 */
export interface RateLimiterProvider {
  check(identifier: string, limit: number, windowMs: number): RateLimitResult;
}

// ─── In-Memory Implementation ────────────────────────────────────────────────

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Clean up stale entries every 5 minutes to prevent memory leaks in long-running processes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 60000);
      if (record.timestamps.length === 0) {
        rateLimitMap.delete(key);
      }
    }
  }, 300000);
}

/**
 * In-memory sliding window rate limiter.
 *
 * ⚠️  NOT reliable across multiple serverless instances.
 * Use only for local development or as a basic single-instance loop-prevention measure.
 */
export class InMemoryRateLimiter implements RateLimiterProvider {
  check(
    identifier: string,
    limit: number = 20,
    windowMs: number = 60000
  ): RateLimitResult {
    // Sanitize identifier — fall back to 'unknown' for empty/malformed values
    const safeIdentifier =
      identifier && typeof identifier === 'string' && identifier.trim()
        ? identifier.trim().substring(0, 64)
        : 'unknown';

    const now = Date.now();
    let record = rateLimitMap.get(safeIdentifier);

    if (!record) {
      record = { timestamps: [] };
      rateLimitMap.set(safeIdentifier, record);
    }

    // Filter timestamps within the current window
    record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

    if (record.timestamps.length >= limit) {
      const oldestTimestamp = record.timestamps[0];
      const resetSeconds = Math.ceil((oldestTimestamp + windowMs - now) / 1000);
      return {
        allowed: false,
        limit,
        remaining: 0,
        resetSeconds: Math.max(1, resetSeconds),
      };
    }

    record.timestamps.push(now);
    return {
      allowed: true,
      limit,
      remaining: limit - record.timestamps.length,
      resetSeconds: Math.ceil(windowMs / 1000),
    };
  }
}

// Singleton in-memory limiter instance
const defaultLimiter = new InMemoryRateLimiter();

/**
 * Checks rate limit for an identifier using the configured provider.
 *
 * @param identifier - Client IP or other unique key
 * @param limit - Max requests per window (default: 20)
 * @param windowMs - Window duration in ms (default: 60000 = 1 minute)
 * @param provider - Optional custom provider (defaults to InMemoryRateLimiter)
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 20,
  windowMs: number = 60000,
  provider: RateLimiterProvider = defaultLimiter
): RateLimitResult {
  return provider.check(identifier, limit, windowMs);
}
