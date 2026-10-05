import { NextResponse } from 'next/server';
import { requireAuth } from '@/server/auth/rbac';
import { createOrderSchema } from '@/server/validators/order.schema';
import { createOrder, listOrders } from '@/server/services/orderService';
import { handleError } from '@/server/http';

export async function POST(request: Request) {
  try {
    const session = await requireAuth(request);
    const body = await request.json();
    const validatedData = createOrderSchema.parse(body);

    const order = await createOrder(session, validatedData);

    return NextResponse.json(
      {
        success: true,
        data: order,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function GET(request: Request) {
  try {
    const session = await requireAuth(request);
    const orders = await listOrders(session);

    return NextResponse.json(
      {
        success: true,
        data: orders,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}
