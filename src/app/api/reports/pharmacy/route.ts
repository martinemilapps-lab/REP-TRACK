import { NextRequest, NextResponse } from 'next/server';
import { PharmacyVisitSchema } from '@/lib/validation';
import { requireAuthenticatedUser } from '@/lib/auth';
import { createPharmacyVisit } from '@/lib/services/pharmacyService';
import { handleApiError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuthenticatedUser();
    const rawData = await req.json();
    const validatedData = PharmacyVisitSchema.parse(rawData);

    const result = await createPharmacyVisit(session, validatedData);

    return NextResponse.json({
      success: true,
      message: 'تم إضافة زيارة الصيدلية وتسجيلها في السجل بنجاح ✓',
      record: result,
      isUpdate: false,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
