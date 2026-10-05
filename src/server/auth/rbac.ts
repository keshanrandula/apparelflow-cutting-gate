import { Role } from '@prisma/client';
import { getSession, SessionPayload } from './session';
import { UnauthorizedError, ForbiddenError } from '../http';

export async function requireAuth(request: Request): Promise<SessionPayload> {
  const session = await getSession(request);
  if (!session) {
    throw new UnauthorizedError('Authentication required. Please log in.');
  }
  return session;
}

export function requireRole(session: SessionPayload, allowedRoles: Role[]): void {
  if (!allowedRoles.includes(session.role)) {
    throw new ForbiddenError(
      `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]. Current role: ${session.role}`
    );
  }
}
