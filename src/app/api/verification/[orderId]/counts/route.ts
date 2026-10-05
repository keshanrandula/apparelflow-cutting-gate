import { NextResponse } from 'next/server';
import { requireAuth } from '@/server/auth/rbac';
import { saveCountsSchema } from '@/server/validators/verification.schema';
import { saveCounts } from '@/server/services/verificationService';
import { handleError } from '@/server/http';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await requireAuth(request);
    const { orderId } = await params;
    const body = await request.json();
    const validatedData = saveCountsSchema.parse(body);

    const updatedOrder = await saveCounts(session, orderId, validatedData.counts);

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
