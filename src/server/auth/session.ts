import { SignJWT, jwtVerify } from 'jose';
import { Role } from '@prisma/client';

export const AUTH_COOKIE_NAME = 'auth_token';
export const TOKEN_EXPIRY_SECONDS = 8 * 60 * 60; // 8 hours

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: Role;
  [key: string]: unknown;
}

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('FATAL SECURITY ERROR: JWT_SECRET environment variable is missing in production!');
  }
  const resolved = secret || 'apparelflow-production-grade-jwt-secret-minimum-32-chars-key';
  if (resolved.length < 32) {
    throw new Error('FATAL SECURITY ERROR: JWT_SECRET must be at least 32 characters long!');
  }
  return new TextEncoder().encode(resolved);
}

export async function signToken(payload: SessionPayload): Promise<string> {
  const secretKey = getJwtSecret();
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(secretKey);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const secretKey = getJwtSecret();
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256'],
    });

    if (
      typeof payload.userId === 'string' &&
      typeof payload.email === 'string' &&
      typeof payload.name === 'string' &&
      typeof payload.role === 'string'
    ) {
      return {
        userId: payload.userId,
        email: payload.email,
        name: payload.name,
        role: payload.role as Role,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function parseCookieHeader(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [key, ...v] = c.trim().split('=');
      return [key, decodeURIComponent(v.join('='))];
    })
  );
}

export async function getSession(request: Request): Promise<SessionPayload | null> {
  const cookieHeader = request.headers.get('cookie');
  const cookies = parseCookieHeader(cookieHeader);
  const token = cookies[AUTH_COOKIE_NAME];

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

export function getAuthCookieOptions() {
  return {
    name: AUTH_COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: TOKEN_EXPIRY_SECONDS,
  };
}
