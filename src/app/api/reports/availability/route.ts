import { NextRequest, NextResponse } from 'next/server';
import { ProductAvailabilitySchema } from '@/lib/validation';
import { getServerSession } from '@/lib/auth';
import { upsertProductAvailability } from '@/lib/services/availabilityService';
import { handleApiError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const rawData = await req.json();
    const validatedData = ProductAvailabilitySchema.parse(rawData);
    const session = await getServerSession();

    const { record, isUpdate, hospitalName, productName } = await upsertProductAvailability(
      session,
      validatedData
    );

    return NextResponse.json({
      success: true,
      message: isUpdate
        ? `تم تحديث توفر منتج ${productName} في ${hospitalName} لشهر ${validatedData.month} بنجاح ✓`
        : `تم تسجيل توفر منتج ${productName} في ${hospitalName} لشهر ${validatedData.month} بنجاح ✓`,
      record,
      isUpdate,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
