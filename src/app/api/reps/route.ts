import { NextRequest, NextResponse } from 'next/server';
import { getRepresentativesCoverageBatch } from '@/lib/services/representativeService';
import { db, representatives } from '@/lib/db';
import { eq, inArray } from 'drizzle-orm';
import { requireAuthenticatedUser } from '@/lib/auth';
import { hierarchyService } from '@/lib/services/hierarchyService';
import { handleApiError } from '@/lib/errors';
import { resolveWritableRepId } from '@/lib/repAccessPolicy';
import { z } from 'zod';

const CoverageTargetUpdateSchema = z.object({
  repId: z.string().min(1).optional(),
  assignedHospitals: z.coerce.number().int().min(0).max(10000).optional(),
  assignedPharmacies: z.coerce.number().int().min(0).max(10000).optional(),
  assignedDrs: z.coerce.number().int().min(0).max(10000).optional(),
}).refine((value) => value.assignedHospitals !== undefined || value.assignedPharmacies !== undefined || value.assignedDrs !== undefined, 'At least one target is required');

export async function GET() {
  try {
    const session = await requireAuthenticatedUser();
    let allowedIds: string[] = [];
    if (session.systemRole === 'ADMIN') {
      const allActiveReps = await db.select({ id: representatives.id }).from(representatives).where(eq(representatives.isActive, true)).all();
      allowedIds = allActiveReps.map((r) => r.id);
    } else if (session.role === 'REPRESENTATIVE') {
      allowedIds = [session.repId].filter((id): id is string => Boolean(id));
    } else {
      allowedIds = await hierarchyService.getScopedRepIds(session);
    }
    const allReps = allowedIds.length ? await db.select().from(representatives).where(inArray(representatives.id, allowedIds)).all() : [];

    let coverageSummaries: Awaited<ReturnType<typeof getRepresentativesCoverageBatch>> = [];
    try {
      coverageSummaries = await getRepresentativesCoverageBatch(allReps);
    } catch (covErr) {
      console.warn('Could not compute coverage summaries for reps:', covErr);
    }

    return NextResponse.json({
      reps: allReps,
      coverage: coverageSummaries,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAuthenticatedUser();
    const body = CoverageTargetUpdateSchema.parse(await req.json());
    const { repId, assignedHospitals, assignedPharmacies, assignedDrs } = body;
    const ownedRepId = resolveWritableRepId(session, repId);

    const updatePayload: Partial<typeof representatives.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (assignedHospitals !== undefined) updatePayload.assignedHospitals = assignedHospitals;
    if (assignedPharmacies !== undefined) updatePayload.assignedPharmacies = assignedPharmacies;
    if (assignedDrs !== undefined) updatePayload.assignedDrs = assignedDrs;

    await db.update(representatives).set(updatePayload).where(eq(representatives.id, ownedRepId));

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
