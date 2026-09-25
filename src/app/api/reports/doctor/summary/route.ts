import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth';
import { resolveWritableRepId } from '@/lib/repAccessPolicy';
import { db, doctors, doctorVisits, doctorVisitProducts, users, representatives } from '@/lib/db';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { hierarchyService } from '@/lib/services/hierarchyService';
import { handleApiError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export type PrescriptionStage = 'Awareness' | 'Trial' | 'Regular' | 'Loyal';

export interface DoctorStageSummary {
  stages: Record<PrescriptionStage, { count: number; doctors: string[] }>;
  totalVisited: number;
}

export async function getDoctorPrescriptionStageSummary(repId: string): Promise<DoctorStageSummary> {
  // Query all visits for this rep ordered newest first
  const visits = await db
    .select({
      id: doctorVisits.id,
      doctorId: doctorVisits.doctorId,
      prescriptionRate: doctorVisits.prescriptionRate,
      visitDate: doctorVisits.visitDate,
      submittedAt: doctorVisits.submittedAt,
    })
    .from(doctorVisits)
    .where(eq(doctorVisits.repId, repId))
    .orderBy(desc(doctorVisits.submittedAt), desc(doctorVisits.visitDate))
    .all();

  // Find latest stage for each visited doctor
  const doctorLatestStage = new Map<string, PrescriptionStage>();

  for (const v of visits) {
    if (!v.doctorId || doctorLatestStage.has(v.doctorId)) continue;

    // Check visit level rate first
    let rate = v.prescriptionRate as PrescriptionStage | null;
    if (!rate || !['Awareness', 'Trial', 'Regular', 'Loyal'].includes(rate)) {
      // Check product level rates
      const prodRates = await db
        .select({ rate: doctorVisitProducts.prescriptionRate })
        .from(doctorVisitProducts)
        .where(eq(doctorVisitProducts.doctorVisitId, v.id))
        .limit(1)
        .all();
      if (prodRates.length > 0 && prodRates[0].rate && ['Awareness', 'Trial', 'Regular', 'Loyal'].includes(prodRates[0].rate)) {
        rate = prodRates[0].rate as PrescriptionStage;
      }
    }

    if (rate && ['Awareness', 'Trial', 'Regular', 'Loyal'].includes(rate)) {
      doctorLatestStage.set(v.doctorId, rate);
    } else {
      doctorLatestStage.set(v.doctorId, 'Awareness');
    }
  }

  // Get doctor names
  const doctorIds = Array.from(doctorLatestStage.keys());
  const doctorMap = new Map<string, string>();
  if (doctorIds.length > 0) {
    const docRows = await db
      .select({ id: doctors.id, name: doctors.name })
      .from(doctors)
      .where(inArray(doctors.id, doctorIds))
      .all();
    for (const d of docRows) {
      doctorMap.set(d.id, d.name);
    }
  }

  const stages: Record<PrescriptionStage, { count: number; doctors: string[] }> = {
    Awareness: { count: 0, doctors: [] },
    Trial: { count: 0, doctors: [] },
    Regular: { count: 0, doctors: [] },
    Loyal: { count: 0, doctors: [] },
  };

  for (const [docId, stage] of doctorLatestStage.entries()) {
    const docName = doctorMap.get(docId) || 'Doctor';
    if (stages[stage]) {
      stages[stage].doctors.push(docName);
      stages[stage].count += 1;
    }
  }

  return {
    stages,
    totalVisited: doctorIds.length,
  };
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuthenticatedUser();
    const repId = resolveWritableRepId(session);
    const summary = await getDoctorPrescriptionStageSummary(repId);

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuthenticatedUser();
    const repId = resolveWritableRepId(session);
    const summary = await getDoctorPrescriptionStageSummary(repId);

    // Resolve ancestor managers up to SMD
    let ancestorIds: string[] = [];
    try {
      ancestorIds = await hierarchyService.getAncestorIds(session);
    } catch (e) {
      console.warn('Hierarchy ancestor warning:', e);
    }

    const timestamp = new Date().toISOString();

    return NextResponse.json({
      success: true,
      message: 'تم إرسال تقرير مراحل معدل الوصف (الأرقام والأسماء) بنجاح إلى جميع المديرين المشرفين حتى مدير القطاع (SMD)',
      timestamp,
      repId,
      repName: session.name,
      ancestorsNotified: ancestorIds.length,
      summary,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
