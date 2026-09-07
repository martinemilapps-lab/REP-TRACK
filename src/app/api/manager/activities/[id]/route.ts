import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth';
import { getManagerActivityById, deleteManagerActivity } from '@/lib/services/managerActivityService';
import { handleApiError } from '@/lib/errors';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuthenticatedUser();
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
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuthenticatedUser();
    if (!session) {
      return NextResponse.json({ success: false, message: 'يجب تسجيل الدخول أولاً' }, { status: 401 });
    }

    const { id } = await params;
    await deleteManagerActivity(session, id);

    return NextResponse.json({ success: true, message: 'تم حذف تقرير النشاط بنجاح ✓' });
  } catch (error) {
    return handleApiError(error);
  }
}
