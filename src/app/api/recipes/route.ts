import { NextResponse } from 'next/server';
import { requireAuth } from '@/server/auth/rbac';
import { getAllRecipes, getExpectedComponents } from '@/server/services/orderService';
import { handleError } from '@/server/http';
import { getExpectedComponentsSchema } from '@/server/validators/order.schema';

export async function GET(request: Request) {
  try {
    await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const recipeId = searchParams.get('recipeId');
    const targetQty = searchParams.get('targetQty');

    // If query params are supplied, compute dynamic expected components
    if (recipeId && targetQty) {
      const validated = getExpectedComponentsSchema.parse({ recipeId, targetQty });
      const calculation = await getExpectedComponents(validated.recipeId, validated.targetQty);
      return NextResponse.json({ success: true, data: calculation }, { status: 200 });
    }

    // Otherwise return list of all recipes
    const recipes = await getAllRecipes();
    return NextResponse.json({ success: true, data: recipes }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}
