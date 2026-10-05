import { NextResponse } from 'next/server';
import { requireAuth } from '@/server/auth/rbac';
import { saveComponentCountsSchema } from '@/server/validators/verification.schema';
import { saveComponentCounts } from '@/server/services/verificationService';
import { handleError } from '@/server/http';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request);
    const { id } = await params;
    const body = await request.json();
    const validatedData = saveComponentCountsSchema.parse(body);

    const updatedOrder = await saveComponentCounts(session, id, validatedData);

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
