import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { saveManagerActivity, getManagerActivities } from '@/lib/services/managerActivityService';
import { AppError } from '@/lib/errors';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
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
    console.error('Error fetching manager activities:', error);
    if (error instanceof AppError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, message: 'حدث خطأ أثناء جلب تقارير الأنشطة' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
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
    console.error('Error saving manager activity:', error);
    if (error instanceof z.ZodError) {
      const issue = error.issues[0];
      return NextResponse.json(
        { success: false, message: issue ? `${issue.message}` : 'بيانات التقرير غير صالحة' },
        { status: 400 }
      );
    }
    if (error instanceof AppError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, message: 'حدث خطأ أثناء حفظ تقرير النشاط' }, { status: 500 });
  }
}
