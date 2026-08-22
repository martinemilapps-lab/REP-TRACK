import { NextRequest, NextResponse } from 'next/server';
import { HospitalVisitSchema } from '@/lib/validation';
import { getServerSession } from '@/lib/auth';
import { createHospitalVisit } from '@/lib/services/hospitalService';
import { handleApiError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const rawData = await req.json();
    const validatedData = HospitalVisitSchema.parse(rawData);
    const session = await getServerSession();

    const result = await createHospitalVisit(session, validatedData);

    return NextResponse.json({
      success: true,
      message: 'تم إضافة زيارة المستشفى وتسجيلها في السجل بنجاح ✓',
      record: result,
      isUpdate: false,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
