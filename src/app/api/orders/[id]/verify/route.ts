import { NextResponse } from 'next/server';
import { requireAuth } from '@/server/auth/rbac';
import { verifyOrderSchema } from '@/server/validators/verification.schema';
import { verifyOrder } from '@/server/services/verificationService';
import { handleError } from '@/server/http';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request);
    const { id } = await params;
    const body = await request.json();
    const validatedData = verifyOrderSchema.parse(body);

    const updatedOrder = await verifyOrder(session, id, validatedData);

    return NextResponse.json(
      {
        success: true,
        data: updatedOrder,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}
