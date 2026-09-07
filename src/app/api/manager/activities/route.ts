import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth';
import { saveManagerActivity, getManagerActivities } from '@/lib/services/managerActivityService';
import { handleApiError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuthenticatedUser();
    if (!session) {
      return NextResponse.json({ success: false, message: 'يجب تسجيل الدخول أولاً' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const activityType = searchParams.get('activityType') || undefined;

    const activities = await getManagerActivities(session, {
      startDate,
      endDate,
      activityType,
    });

    return NextResponse.json({
      success: true,
      activities,
      total: activities.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuthenticatedUser();
    if (!session) {
      return NextResponse.json({ success: false, message: 'يجب تسجيل الدخول أولاً' }, { status: 401 });
    }

    const body = await request.json();
    const activity = await saveManagerActivity(session, body);

    return NextResponse.json({
      success: true,
      message: 'تم حفظ تقرير النشاط بنجاح ✓',
      activity,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
