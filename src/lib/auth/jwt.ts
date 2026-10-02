import { SignJWT, jwtVerify, JWTPayload } from 'jose';

export interface SessionPayload extends JWTPayload {
  userId: string;
  email: string;
  role: 'owner' | 'user';
}

/**
 * Derives the HMAC-SHA256 secret key from the environment.
 * NEVER allows a fallback secret — throws an explicit Error if
 * SESSION_SECRET is missing or shorter than 32 characters.
 */
function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET must be set and at least 32 characters long');
  }
  return new TextEncoder().encode(secret);
}

/**
 * Signs a session payload into a compact JWS (JWT) valid for 7 days.
 */
export async function signSession(payload: {
  userId: string;
  email: string;
  role: 'owner' | 'user';
}): Promise<string> {
  const key = getSecretKey();

  return new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

/**
 * Verifies a compact JWS (JWT) token and extracts the session payload.
 * Returns null if the token is expired, tampered, or invalid.
 */
export async function verifySession(token: string): Promise<SessionPayload | null> {
  if (!token || typeof token !== 'string') return null;

  try {
    const key = getSecretKey();
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });

    if (!payload.userId || !payload.email) {
      return null;
    }

    return payload as SessionPayload;
  } catch {
    return null;
  }
}
