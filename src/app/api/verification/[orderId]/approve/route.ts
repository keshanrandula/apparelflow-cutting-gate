import { NextResponse } from 'next/server';
import { requireAuth } from '@/server/auth/rbac';
import { approveOrderSchema } from '@/server/validators/verification.schema';
import { approveOrder } from '@/server/services/verificationService';
import { handleError } from '@/server/http';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await requireAuth(request);
    const { orderId } = await params;
    const body = await request.json();
    const validatedData = approveOrderSchema.parse(body);

    const approvedOrder = await approveOrder(session, orderId, validatedData.counts);

    return NextResponse.json(
      {
        success: true,
        data: approvedOrder,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}
