import { NextRequest, NextResponse } from 'next/server';
import { getWeeklyPlanById } from '@/lib/services/weeklyPlanService';
import { generateWeeklyPlanWorkbook } from '@/lib/excel';

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

    const buffer = generateWeeklyPlanWorkbook(plan);
    const repClean = (plan.rep || 'Rep').replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, '_');
    const startClean = (plan.startDate || 'start').replace(/[^a-zA-Z0-9_-]/g, '-');
    const filename = `Weekly_Plan_${repClean}_${startClean}.xlsx`;

    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error exporting weekly plan:', error);
    return NextResponse.json(
      { success: false, message: 'فشل في تصدير الخطة كملف إكسل' },
      { status: 500 }
    );
  }
}
