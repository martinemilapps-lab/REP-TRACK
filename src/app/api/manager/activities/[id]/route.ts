import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { getManagerActivityById, deleteManagerActivity } from '@/lib/services/managerActivityService';
import { AppError } from '@/lib/errors';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'يجب تسجيل الدخول أولاً' }, { status: 401 });
    }

    const { id } = await params;
    const activity = await getManagerActivityById(session, id);

    if (!activity) {
      return NextResponse.json({ success: false, message: 'تقرير النشاط غير موجود' }, { status: 404 });
    }

    return NextResponse.json({ success: true, activity });
  } catch (error) {
    console.error('Error fetching manager activity:', error);
    if (error instanceof AppError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, message: 'حدث خطأ أثناء جلب تقرير النشاط' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'يجب تسجيل الدخول أولاً' }, { status: 401 });
    }

    const { id } = await params;
    await deleteManagerActivity(session, id);

    return NextResponse.json({ success: true, message: 'تم حذف تقرير النشاط بنجاح ✓' });
  } catch (error) {
    console.error('Error deleting manager activity:', error);
    if (error instanceof AppError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, message: 'حدث خطأ أثناء حذف تقرير النشاط' }, { status: 500 });
  }
}
