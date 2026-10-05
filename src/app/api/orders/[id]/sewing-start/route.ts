import { NextResponse } from 'next/server';
import { requireAuth } from '@/server/auth/rbac';
import { startSewingSchema } from '@/server/validators/verification.schema';
import { startSewingJob } from '@/server/services/verificationService';
import { handleError } from '@/server/http';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request);
    const { id } = await params;

    let notes: string | undefined;
    try {
      const body = await request.json();
      const validated = startSewingSchema.parse(body);
      notes = validated.notes;
    } catch {
      notes = undefined;
    }

    const result = await startSewingJob(session, id, { notes });

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}
