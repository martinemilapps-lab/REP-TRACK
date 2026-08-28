import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import {
  getMasterListsForRep,
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
import { AppError } from '@/lib/errors';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const repParam = searchParams.get('rep') || undefined;

    const data = await getMasterListsForRep(repParam);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching master lists:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء جلب القوائم' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    const body = await request.json();
    const { category, item, rep } = body;

    if (!category || !item) {
      return NextResponse.json(
        { success: false, message: 'فئة العميل والبيانات مطلوبة' },
        { status: 400 }
      );
    }

    let savedResult;
    const repToUse = session?.role === 'REPRESENTATIVE' ? session.name : rep;

    if (category === 'hospitals') {
      const validated = MasterHospitalSchema.parse({ ...item, rep: repToUse });
      savedResult = await saveMasterHospital(validated);
    } else if (category === 'pharmacies') {
      const validated = MasterPharmacySchema.parse({ ...item, rep: repToUse });
      savedResult = await saveMasterPharmacy(validated);
    } else if (category === 'doctors') {
      const validated = MasterDoctorSchema.parse({ ...item, rep: repToUse });
      savedResult = await saveMasterDoctor(validated);
    } else if (category === 'branches') {
      const validated = MasterBranchSchema.parse({ ...item, rep: repToUse });
      savedResult = await saveMasterBranch(validated);
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
    console.error('Error saving master item:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: error.issues[0]?.message || 'بيانات العميل غير صالحة' },
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
      { success: false, message: 'حدث خطأ أثناء حفظ بيانات العميل' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') as 'hospitals' | 'pharmacies' | 'doctors' | 'branches';
    const id = searchParams.get('id');

    if (!category || !id) {
      return NextResponse.json(
        { success: false, message: 'معرف العنصر والفئة مطلوبان للحذف' },
        { status: 400 }
      );
    }

    await deleteMasterItem(category, id);

    return NextResponse.json({
      success: true,
      message: 'تم حذف العميل من القائمة بنجاح',
    });
  } catch (error) {
    console.error('Error deleting master item:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء الحذف' },
      { status: 500 }
    );
  }
}
