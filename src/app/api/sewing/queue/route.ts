import { NextResponse } from 'next/server';
import { requireAuth } from '@/server/auth/rbac';
import { getSewingQueue } from '@/server/services/sewingService';
import { handleError } from '@/server/http';

export async function GET(request: Request) {
  try {
    const session = await requireAuth(request);

    // URL search params are intentionally ignored and stripped to prevent query parameter tampering
    const queue = await getSewingQueue(session);

    return NextResponse.json(
      {
        success: true,
        data: queue,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}
