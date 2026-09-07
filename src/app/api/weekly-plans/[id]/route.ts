import { WeeklyPlanStatusUpdateSchema } from '@/lib/validation';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth';
import { getWeeklyPlanById, updateWeeklyPlanStatus, deleteWeeklyPlan } from '@/lib/services/weeklyPlanService';
import { handleApiError } from '@/lib/errors';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireAuthenticatedUser();
    const plan = await getWeeklyPlanById(id, session);

    if (!plan) {
      return NextResponse.json(
        { success: false, message: 'الخطة غير موجودة' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      plan,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuthenticatedUser();
    const { id } = await params;
    const body = WeeklyPlanStatusUpdateSchema.parse(await request.json());

    const plan = await updateWeeklyPlanStatus(
      session,
      id,
      body.status,
      body.managerNotes
    );

    return NextResponse.json({
      success: true,
      message: 'تم تحديث حالة الخطة بنجاح ✓',
      plan,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuthenticatedUser();
    const { id } = await params;

    await deleteWeeklyPlan(session, id);

    return NextResponse.json({
      success: true,
      message: 'تم حذف الخطة بنجاح',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
