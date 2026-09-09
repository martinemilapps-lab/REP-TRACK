import { NextRequest, NextResponse } from 'next/server';
import { EventSchema } from '@/lib/validation';
import { requireAuthenticatedUser } from '@/lib/auth';
import { createEventRecord, getEventsList } from '@/lib/services/eventService';
import { handleApiError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const rawData = await req.json();
    const validatedData = EventSchema.parse(rawData);
    const session = await requireAuthenticatedUser();

    const record = await createEventRecord(session, validatedData);

    return NextResponse.json({
      success: true,
      message: `تم تسجيل فعالية "${record.title}" بنجاح ✓`,
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

    const list = await getEventsList(session, { repName });
    return NextResponse.json({ success: true, events: list });
  } catch (error) {
    return handleApiError(error);
  }
}
