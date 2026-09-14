import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth';
import { createBranchVisit } from '@/lib/services/branchService';
import { handleApiError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuthenticatedUser();
    const rawData = await req.json();
    const result = await createBranchVisit(session, rawData);

    return NextResponse.json({
      success: true,
      message: 'تم إضافة زيارة الفرع وتسجيلها في السجل بنجاح ✓',
      record: result,
      isUpdate: false,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
