import { NextRequest, NextResponse } from 'next/server';
import { HospitalVisitSchema } from '@/lib/validation';
import { requireAuthenticatedUser } from '@/lib/auth';
import { createHospitalVisit, saveHospitalDailyReport } from '@/lib/services/hospitalService';
import { handleApiError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuthenticatedUser();
    const rawData = await req.json();
    if(Array.isArray(rawData?.visits)){const report=await saveHospitalDailyReport(session,rawData);return NextResponse.json({success:true,message:'Hospital daily report saved',report})}
    const validatedData = HospitalVisitSchema.parse(rawData);

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
