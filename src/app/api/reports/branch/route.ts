import { NextRequest, NextResponse } from 'next/server';
import { BranchVisitSchema } from '@/lib/validation';
import { getServerSession } from '@/lib/auth';
import { createBranchVisit } from '@/lib/services/branchService';
import { handleApiError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const rawData = await req.json();
    const validatedData = BranchVisitSchema.parse(rawData);
    const session = await getServerSession();

    const result = await createBranchVisit(session, validatedData);

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
