import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth';
import { createDoctorVisit } from '@/lib/services/doctorService';
import { handleApiError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuthenticatedUser();
    const rawData = await req.json();
    const result = await createDoctorVisit(session, rawData);

    return NextResponse.json({
      success: true,
      message: 'تم إضافة زيارة الدكتور وتسجيلها في السجل بنجاح ✓',
      record: result,
      isUpdate: false,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
