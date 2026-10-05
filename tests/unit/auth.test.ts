import { describe, it, expect } from 'vitest';
import { signToken, verifyToken, SessionPayload } from '@/server/auth/session';
import { requireRole } from '@/server/auth/rbac';
import { ForbiddenError, ValidationError, BusinessRuleError, InvalidTransitionError, handleError } from '@/server/http';
import { Role } from '@prisma/client';

describe('Auth & Session Layer Unit Tests', () => {
  const sampleUser: SessionPayload = {
    userId: 'user-123',
    email: 'supervisor@apparelflow.com',
    name: 'Nimal Perera',
    role: Role.cutting_supervisor,
  };

  it('signs and verifies a valid JWT payload using jose HS256', async () => {
    const token = await signToken(sampleUser);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(20);

    const verified = await verifyToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe(sampleUser.userId);
    expect(verified?.email).toBe(sampleUser.email);
    expect(verified?.role).toBe(Role.cutting_supervisor);
  });

  it('rejects tampered or malformed tokens safely', async () => {
    const token = await signToken(sampleUser);
    const tampered = token.slice(0, -5) + 'abcde';
    const verified = await verifyToken(tampered);
    expect(verified).toBeNull();

    const invalid = await verifyToken('random-invalid-string');
    expect(invalid).toBeNull();
  });

  it('RBAC requireRole allows authorized roles and throws ForbiddenError for unauthorized roles', () => {
    // Should pass without error
    expect(() => requireRole(sampleUser, [Role.cutting_supervisor, Role.cutting_verifier])).not.toThrow();

    // Should throw ForbiddenError (403)
    expect(() => requireRole(sampleUser, [Role.cutting_verifier, Role.sewing_supervisor])).toThrow(ForbiddenError);
  });

  it('handleError central error handler maps typed errors without leaking stack traces', async () => {
    const forbiddenRes = handleError(new ForbiddenError('Custom forbidden'));
    expect(forbiddenRes.status).toBe(403);
    const forbiddenBody = await forbiddenRes.json();
    expect(forbiddenBody).toEqual({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Custom forbidden',
      },
    });

    const invalidTransRes = handleError(new InvalidTransitionError('Cannot transition from REJECTED to VERIFIED'));
    expect(invalidTransRes.status).toBe(409);
    const invalidTransBody = await invalidTransRes.json();
    expect(invalidTransBody.error.code).toBe('INVALID_TRANSITION');

    const businessRuleRes = handleError(new BusinessRuleError('All items must be GREEN'));
    expect(businessRuleRes.status).toBe(422);

    const valRes = handleError(new ValidationError('Bad inputs', { qty: ['Must be positive'] }));
    expect(valRes.status).toBe(400);
    const valBody = await valRes.json();
    expect(valBody.error.details.qty).toContain('Must be positive');
  });
});
