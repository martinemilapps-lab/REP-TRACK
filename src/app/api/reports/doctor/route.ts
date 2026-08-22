import { NextRequest, NextResponse } from 'next/server';
import { DoctorVisitSchema } from '@/lib/validation';
import { getServerSession } from '@/lib/auth';
import { createDoctorVisit } from '@/lib/services/doctorService';
import { handleApiError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const rawData = await req.json();
    const validatedData = DoctorVisitSchema.parse(rawData);
    const session = await getServerSession();

    const result = await createDoctorVisit(session, validatedData);

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
