import { NextResponse } from 'next/server';
import { requireAuth } from '@/server/auth/rbac';
import { getUserProfile } from '@/server/services/auth.service';
import { handleError } from '@/server/http';

export async function GET(request: Request) {
  try {
    const session = await requireAuth(request);
    const user = await getUserProfile(session.userId);

    return NextResponse.json(
      {
        success: true,
        data: { user },
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}
