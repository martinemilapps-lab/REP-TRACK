import { NextRequest, NextResponse } from 'next/server';
import { SpecialTaskSchema } from '@/lib/validation';
import { getServerSession } from '@/lib/auth';
import { createSpecialTaskRecord, getSpecialTasksList } from '@/lib/services/specialTaskService';
import { handleApiError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const rawData = await req.json();
    const validatedData = SpecialTaskSchema.parse(rawData);
    const session = await getServerSession();

    const record = await createSpecialTaskRecord(session, validatedData);

    return NextResponse.json({
      success: true,
      message: `تم توثيق المهمة "${record.title}" بنجاح ✓`,
      record,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    const { searchParams } = new URL(req.url);
    const repName = searchParams.get('rep') || undefined;

    const list = await getSpecialTasksList(session, { repName });
    return NextResponse.json({ success: true, specialTasks: list });
  } catch (error) {
    return handleApiError(error);
  }
}
