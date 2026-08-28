import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { saveWeeklyPlan, getWeeklyPlans } from '@/lib/services/weeklyPlanService';
import { AppError } from '@/lib/errors';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    const searchParams = request.nextUrl.searchParams;
    const repParam = searchParams.get('rep');
    const repIdParam = searchParams.get('repId');

    const plans = await getWeeklyPlans(session, {
      repName: repParam,
      repId: repIdParam,
    });

    return NextResponse.json({
      success: true,
      plans,
      total: plans.length,
    });
  } catch (error) {
    console.error('Error fetching weekly plans:', error);
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء جلب الخطط الأسبوعية' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    const body = await request.json();

    const plan = await saveWeeklyPlan(session, body);

    return NextResponse.json({
      success: true,
      message: 'تم حفظ الخطة الأسبوعية بنجاح ✓',
      plan,
    });
  } catch (error) {
    console.error('Error saving weekly plan:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: error.issues[0]?.message || 'بيانات الخطة غير صالحة' },
        { status: 400 }
      );
    }
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء حفظ الخطة الأسبوعية' },
      { status: 500 }
    );
  }
}
