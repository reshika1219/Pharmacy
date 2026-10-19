import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'examplepos-super-secure-production-jwt-secret-key-2026'
);

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hashed: string): Promise<boolean> {
  try {
    // Also handle legacy PBKDF2 hashes if any exist
    if (hashed.startsWith('pbkdf2:')) {
      const crypto = await import('crypto');
      const parts = hashed.split('$');
      if (parts.length === 3) {
        const [, salt, keyHex] = parts;
        const rounds = 100000;
        const derivedKey = crypto.pbkdf2Sync(password, salt, rounds, 32, 'sha256');
        return crypto.timingSafeEqual(derivedKey, Buffer.from(keyHex, 'hex'));
      }
    }
    return await bcrypt.compare(password, hashed);
  } catch {
    return false;
  }
}

export interface SessionPayload {
  userId: number;
  username: string;
  role: string;
  fullName: string | null;
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as number,
      username: payload.username as string,
      role: payload.role as string,
      fullName: (payload.fullName as string) || null,
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function authenticateRequest(req: NextRequest): Promise<SessionPayload | null> {
  // Check cookie first
  const cookieToken = req.cookies.get('auth_token')?.value;
  if (cookieToken) {
    const session = await verifySessionToken(cookieToken);
    if (session) return session;
  }

  // Check Authorization header (bearer)
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearerToken = authHeader.substring(7);
    return await verifySessionToken(bearerToken);
  }

  return null;
}
