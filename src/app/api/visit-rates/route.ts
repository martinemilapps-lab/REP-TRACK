import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { requireAuthenticatedUser } from '@/lib/auth';
import { db, representativeVisitRates, representatives } from '@/lib/db';
import { handleApiError, AppError } from '@/lib/errors';
import { resolveWritableRepId } from '@/lib/repAccessPolicy';
import { hierarchyService } from '@/lib/services/hierarchyService';

const rateInputSchema = z.object({
  repId: z.string().min(1),
  customerCategory: z.enum(['HOSPITAL', 'DOCTOR', 'PHARMACY', 'DISTRIBUTION_BRANCH']),
  dailyRate: z.coerce.number().int().min(0),
  workingDaysPerWeek: z.coerce.number().int().min(1).max(7).default(6),
  workingDaysPerMonth: z.coerce.number().int().min(1).max(31).default(26),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
}).strict();

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuthenticatedUser();
    const url = new URL(request.url);
    const targetRepId = url.searchParams.get('repId');

    // If BUM, Manager, or Admin:
    const isManagerOrAdmin = session.role === 'MANAGER' || session.systemRole === 'ADMIN';

    if (isManagerOrAdmin && (!url.searchParams.has('self') || targetRepId)) {
      let scopedReps: Array<{ id: string; name: string; area: string }> = [];

      try {
        scopedReps = await hierarchyService.getScopedRepresentatives(session);
      } catch (err) {
        console.warn('Could not resolve scoped reps for session:', err);
      }

      // If Admin has no direct descendants in hierarchy, allow managing all active reps
      if (session.systemRole === 'ADMIN' && scopedReps.length === 0) {
        scopedReps = await db
          .select({ id: representatives.id, name: representatives.name, area: representatives.area })
          .from(representatives)
          .where(eq(representatives.isActive, true))
          .all();
      }

      if (targetRepId) {
        // Assert visibility if not Admin
        if (session.systemRole !== 'ADMIN') {
          await hierarchyService.assertRepVisible(session, targetRepId);
        }

        const repRates = await db
          .select()
          .from(representativeVisitRates)
          .where(eq(representativeVisitRates.repId, targetRepId))
          .orderBy(desc(representativeVisitRates.effectiveFrom))
          .all();

        const latest = [...new Map(repRates.map((r) => [r.customerCategory, r])).values()].map((r) => ({
          ...r,
          requiredPerWeek: r.dailyRate * r.workingDaysPerWeek,
          requiredPerMonth: r.dailyRate * r.workingDaysPerMonth,
        }));

        return NextResponse.json(
          { success: true, reps: scopedReps, rates: latest, history: repRates },
          { headers: { 'Cache-Control': 'private, no-store' } },
        );
      }

      // Return all scoped reps and their rates
      const scopedIds = scopedReps.map((r) => r.id);
      const allRates = scopedIds.length
        ? await db
            .select()
            .from(representativeVisitRates)
            .where(inArray(representativeVisitRates.repId, scopedIds))
            .orderBy(desc(representativeVisitRates.effectiveFrom))
            .all()
        : [];

      const latestPerRep = allRates.map((r) => ({
        ...r,
        requiredPerWeek: r.dailyRate * r.workingDaysPerWeek,
        requiredPerMonth: r.dailyRate * r.workingDaysPerMonth,
      }));

      return NextResponse.json(
        { success: true, reps: scopedReps, rates: latestPerRep },
        { headers: { 'Cache-Control': 'private, no-store' } },
      );
    }

    // Default MR self-rates
    const repId = resolveWritableRepId(session);
    const all = await db
      .select()
      .from(representativeVisitRates)
      .where(eq(representativeVisitRates.repId, repId))
      .orderBy(desc(representativeVisitRates.effectiveFrom))
      .all();

    const latest = [...new Map(all.map((rate) => [rate.customerCategory, rate])).values()].map((rate) => ({
      ...rate,
      requiredPerWeek: rate.dailyRate * rate.workingDaysPerWeek,
      requiredPerMonth: rate.dailyRate * rate.workingDaysPerMonth,
    }));

    return NextResponse.json(
      { success: true, rates: latest },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuthenticatedUser();

    if (session.role !== 'MANAGER' && session.systemRole !== 'ADMIN') {
      throw new AppError('هذا الإجراء مخصص للمناصب الإدارية فقط', 403);
    }

    const body = await request.json();
    const data = rateInputSchema.parse(body);

    // Verify MR is under the manager's supervision if not system admin
    if (session.systemRole !== 'ADMIN') {
      await hierarchyService.assertRepVisible(session, data.repId);
    }

    const existing = await db
      .select()
      .from(representativeVisitRates)
      .where(
        and(
          eq(representativeVisitRates.repId, data.repId),
          eq(representativeVisitRates.customerCategory, data.customerCategory),
          eq(representativeVisitRates.effectiveFrom, data.effectiveFrom),
        ),
      )
      .get();

    const values = {
      ...data,
      updatedAt: new Date(),
    };

    const [rate] = existing
      ? await db
          .update(representativeVisitRates)
          .set(values)
          .where(eq(representativeVisitRates.id, existing.id))
          .returning()
      : await db
          .insert(representativeVisitRates)
          .values({ ...values, id: crypto.randomUUID() })
          .returning();

    return NextResponse.json(
      { success: true, rate },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(request: NextRequest) {
  return PUT(request);
}
