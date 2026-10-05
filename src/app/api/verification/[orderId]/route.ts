import { NextResponse } from 'next/server';
import { requireAuth } from '@/server/auth/rbac';
import { getVerificationSheet } from '@/server/services/verificationService';
import { handleError } from '@/server/http';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await requireAuth(request);
    const { orderId } = await params;

    const data = await getVerificationSheet(session, orderId);

    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}
