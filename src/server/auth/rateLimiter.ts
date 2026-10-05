import { AppError } from '../http';

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests. Please wait before trying again.') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const loginAttempts = new Map<string, RateLimitRecord>();

/**
 * In-Memory Rate Limiter for Authentication & Security Sensitive Endpoints
 * Defaults to max 5 failed attempts per 60 seconds per IP/identifier.
 */
export function checkRateLimit(
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 60 * 1000
): void {
  const now = Date.now();
  const record = loginAttempts.get(identifier);

  if (!record || now > record.resetAt) {
    loginAttempts.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return;
  }

  if (record.count >= maxAttempts) {
    const remainingSecs = Math.ceil((record.resetAt - now) / 1000);
    throw new RateLimitError(
      `Too many failed login attempts. Please try again in ${remainingSecs} seconds.`
    );
  }

  record.count += 1;
}

export function resetRateLimit(identifier: string): void {
  loginAttempts.delete(identifier);
}
