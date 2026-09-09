import { NextRequest, NextResponse } from 'next/server';
import { TrainingSchema } from '@/lib/validation';
import { requireAuthenticatedUser } from '@/lib/auth';
import { createTrainingRecord, getTrainingsList } from '@/lib/services/trainingService';
import { handleApiError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuthenticatedUser();
    const rawData = await req.json();
    const validatedData = TrainingSchema.parse(rawData);

    const record = await createTrainingRecord(session, validatedData);

    return NextResponse.json({
      success: true,
      message: `تم توثيق التدريب "${record.title}" بنجاح ✓`,
      record,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuthenticatedUser();
    const { searchParams } = new URL(req.url);
    const repName = searchParams.get('rep') || undefined;

    const list = await getTrainingsList(session, { repName });
    return NextResponse.json({ success: true, trainings: list });
  } catch (error) {
    return handleApiError(error);
  }
}
