import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import {
  getMasterListsForRep,
  getScopedMasterListsForManager,
  resolveRepOwnership,
  saveMasterHospital,
  saveMasterPharmacy,
  saveMasterDoctor,
  saveMasterBranch,
  deleteMasterItem,
} from '@/lib/services/masterListService';
import {
  MasterHospitalSchema,
  MasterPharmacySchema,
  MasterDoctorSchema,
  MasterBranchSchema,
} from '@/lib/validation';
import { AppError, handleApiError } from '@/lib/errors';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'يجب تسجيل الدخول أولاً' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const repParam = searchParams.get('rep') || undefined;

    // 1. If user is an MR: strictly serve their own list, ignoring any spoofed ?rep param
    if (session.positionCode === 'MR' || session.role === 'REPRESENTATIVE') {
      const ownerRepId = await resolveRepOwnership(session);
      const data = await getMasterListsForRep(ownerRepId);

      return NextResponse.json({
        success: true,
        data,
        readOnly: false,
        rep: {
          id: ownerRepId,
          name: session.name,
          territory: session.primarySalesAssignment?.territoryName || '',
        },
      });
    }

    // 2. If user is a Manager: serve scoped descendant lists (read-only)
    const result = await getScopedMasterListsForManager(session, repParam);

    return NextResponse.json({
      success: true,
      data: result.lists,
      targetRep: result.targetRep,
      readOnly: true,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'يجب تسجيل الدخول أولاً' },
        { status: 401 }
      );
    }

    // Managers cannot edit team lists unless they have a PERSONAL_MR sales assignment
    const isMR = session.positionCode === 'MR' || session.role === 'REPRESENTATIVE';
    if (!isMR && !session.hasPersonalSalesAssignment) {
      return NextResponse.json(
        { success: false, message: 'قوائم الفريق للقراءة فقط ولا يمكن تعديلها' },
        { status: 403 }
      );
    }

    // Resolve owner representative identity strictly from session
    const ownerRepId = await resolveRepOwnership(session);

    const body = await request.json();
    const { category, item } = body;

    if (!category || !item) {
      return NextResponse.json(
        { success: false, message: 'فئة العميل والبيانات مطلوبة' },
        { status: 400 }
      );
    }

    let savedResult;

    if (category === 'hospitals') {
      const validated = MasterHospitalSchema.parse({ ...item, rep: session.name, repId: ownerRepId });
      savedResult = await saveMasterHospital(validated, ownerRepId);
    } else if (category === 'pharmacies') {
      const validated = MasterPharmacySchema.parse({ ...item, rep: session.name, repId: ownerRepId });
      savedResult = await saveMasterPharmacy(validated, ownerRepId);
    } else if (category === 'doctors') {
      const validated = MasterDoctorSchema.parse({ ...item, rep: session.name, repId: ownerRepId });
      savedResult = await saveMasterDoctor(validated, ownerRepId);
    } else if (category === 'branches') {
      const validated = MasterBranchSchema.parse({ ...item, rep: session.name, repId: ownerRepId });
      savedResult = await saveMasterBranch(validated, ownerRepId);
    } else {
      return NextResponse.json(
        { success: false, message: 'فئة عملاء غير صالحة' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'تم حفظ العميل في القائمة بنجاح ✓',
      item: savedResult,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: error.issues[0]?.message || 'بيانات العميل غير صالحة' },
        { status: 400 }
      );
    }
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'يجب تسجيل الدخول أولاً' },
        { status: 401 }
      );
    }

    const isMR = session.positionCode === 'MR' || session.role === 'REPRESENTATIVE';
    if (!isMR && !session.hasPersonalSalesAssignment) {
      return NextResponse.json(
        { success: false, message: 'قوائم الفريق للقراءة فقط ولا يمكن حذف عناصر منها' },
        { status: 403 }
      );
    }

    const ownerRepId = await resolveRepOwnership(session);

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') as 'hospitals' | 'pharmacies' | 'doctors' | 'branches';
    const id = searchParams.get('id');

    if (!category || !id) {
      return NextResponse.json(
        { success: false, message: 'معرف العنصر والفئة مطلوبان للحذف' },
        { status: 400 }
      );
    }

    await deleteMasterItem(category, id, ownerRepId);

    return NextResponse.json({
      success: true,
      message: 'تم حذف العميل من القائمة بنجاح',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
