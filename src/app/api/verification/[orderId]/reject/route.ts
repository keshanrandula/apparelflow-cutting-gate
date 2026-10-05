import { NextResponse } from 'next/server';
import { requireAuth } from '@/server/auth/rbac';
import { rejectOrderSchema } from '@/server/validators/verification.schema';
import { rejectOrder } from '@/server/services/verificationService';
import { handleError } from '@/server/http';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await requireAuth(request);
    const { orderId } = await params;
    const body = await request.json();
    const validatedData = rejectOrderSchema.parse(body);

    const rejectedOrder = await rejectOrder(session, orderId, validatedData.note);

    return NextResponse.json(
      {
        success: true,
        data: rejectedOrder,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}
