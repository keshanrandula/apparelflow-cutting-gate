import { NextResponse } from 'next/server';
import { requireAuth } from '@/server/auth/rbac';
import { getOrderById } from '@/server/services/orderService';
import { handleError } from '@/server/http';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request);
    const { id } = await params;

    const order = await getOrderById(session, id);

    return NextResponse.json(
      {
        success: true,
        data: order,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}
