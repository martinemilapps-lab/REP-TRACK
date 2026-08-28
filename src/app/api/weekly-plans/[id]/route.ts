import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { getWeeklyPlanById, updateWeeklyPlanStatus, deleteWeeklyPlan } from '@/lib/services/weeklyPlanService';
import { AppError } from '@/lib/errors';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const plan = await getWeeklyPlanById(id);

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
    console.error('Error fetching plan:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء جلب الخطة' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    const { id } = await params;
    const body = await request.json();

    const plan = await updateWeeklyPlanStatus(
      session,
      id,
      body.status || 'Submitted',
      body.managerNotes
    );

    return NextResponse.json({
      success: true,
      message: 'تم تحديث حالة الخطة بنجاح ✓',
      plan,
    });
  } catch (error) {
    console.error('Error updating plan status:', error);
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء تحديث الخطة' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    const { id } = await params;

    await deleteWeeklyPlan(session, id);

    return NextResponse.json({
      success: true,
      message: 'تم حذف الخطة بنجاح',
    });
  } catch (error) {
    console.error('Error deleting plan:', error);
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء حذف الخطة' },
      { status: 500 }
    );
  }
}
