import { Role } from '@prisma/client';
import { getSession, SessionPayload } from './session';
import { UnauthorizedError, ForbiddenError } from '../http';

import { prisma } from '@/lib/prisma';

export async function requireAuth(request: Request): Promise<SessionPayload> {
  const session = await getSession(request);
  if (!session) {
    throw new UnauthorizedError('Authentication required. Please log in.');
  }

  // Validate user exists in DB and resolve latest ID
  const dbUser = await prisma.user.findFirst({
    where: {
      OR: [
        { id: session.userId },
        { email: session.email },
      ],
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  if (!dbUser) {
    throw new UnauthorizedError('User session is invalid. Please log in again.');
  }

  return {
    userId: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    role: dbUser.role,
  };
}

export function requireRole(session: SessionPayload, allowedRoles: Role[]): void {
  if (!allowedRoles.includes(session.role)) {
    throw new ForbiddenError(
      `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]. Current role: ${session.role}`
    );
  }
}
