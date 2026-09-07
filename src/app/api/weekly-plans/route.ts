import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth';
import { saveWeeklyPlan, getWeeklyPlans, getTeamWeeklyPlans } from '@/lib/services/weeklyPlanService';
import { handleApiError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuthenticatedUser();
    const searchParams = request.nextUrl.searchParams;
    const repParam = searchParams.get('rep');
    const repIdParam = searchParams.get('repId');
    const personalParam = searchParams.get('personal') === 'true' || searchParams.get('isManagerPersonal') === 'true';
    const userIdParam = searchParams.get('userId');

    const team = searchParams.get('team') === 'true';
    const mode = searchParams.get('scopeMode') === 'DIRECT_REPORTS' ? 'DIRECT_REPORTS' : 'ALL_DESCENDANTS';
    const plans = team ? await getTeamWeeklyPlans(session, mode) : await getWeeklyPlans(session, {
      repName: repParam,
      repId: repIdParam,
      userId: userIdParam,
      personalOnly: personalParam,
    });

    return NextResponse.json({
      success: true,
      plans,
      total: plans.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuthenticatedUser();
    const body = await request.json();

    const plan = await saveWeeklyPlan(session, body);

    return NextResponse.json({
      success: true,
      message: 'تم حفظ الخطة الأسبوعية بنجاح ✓',
      plan,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
