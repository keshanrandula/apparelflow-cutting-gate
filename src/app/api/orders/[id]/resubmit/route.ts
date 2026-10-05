import { NextResponse } from 'next/server';
import { requireAuth } from '@/server/auth/rbac';
import { resubmitOrderSchema } from '@/server/validators/order.schema';
import { resubmitRejectedOrder } from '@/server/services/orderService';
import { handleError } from '@/server/http';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request);
    const { id } = await params;

    let updatedFabricYds: number | undefined;
    try {
      const body = await request.json();
      const validated = resubmitOrderSchema.parse(body);
      updatedFabricYds = validated.updatedFabricYds;
    } catch {
      // Empty body or no updated fabric yardage is allowed on simple resubmit
      updatedFabricYds = undefined;
    }

    const updatedOrder = await resubmitRejectedOrder(session, id, updatedFabricYds);

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
