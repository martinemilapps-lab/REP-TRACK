import { NextRequest, NextResponse } from 'next/server';
import {
  getAllRepresentatives,
  getAllRepresentativesCoverage,
} from '@/lib/services/representativeService';
import { INITIAL_REPRESENTATIVES } from '@/lib/constants';
import { db, representatives } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';

export async function GET() {
  try {
    let allReps = await getAllRepresentatives();
    if (!allReps || allReps.length === 0) {
      allReps = INITIAL_REPRESENTATIVES;
    }

    let coverageSummaries: any[] = [];
    try {
      coverageSummaries = await getAllRepresentativesCoverage();
    } catch (covErr) {
      console.warn('Could not compute coverage summaries for reps:', covErr);
    }

    return NextResponse.json({
      reps: allReps,
      coverage: coverageSummaries,
    });
  } catch (error) {
    console.error('Error in /api/reps:', error);
    return NextResponse.json({
      reps: INITIAL_REPRESENTATIVES,
      coverage: [],
    });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { repName, repId, assignedHospitals, assignedPharmacies, assignedDrs } = body;

    const updatePayload: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (assignedHospitals !== undefined) updatePayload.assignedHospitals = Number(assignedHospitals) || 0;
    if (assignedPharmacies !== undefined) updatePayload.assignedPharmacies = Number(assignedPharmacies) || 0;
    if (assignedDrs !== undefined) updatePayload.assignedDrs = Number(assignedDrs) || 0;

    if (repId) {
      await db.update(representatives).set(updatePayload).where(eq(representatives.id, repId));
    } else if (repName) {
      await db
        .update(representatives)
        .set(updatePayload)
        .where(sql`lower(${representatives.name}) = ${repName.toLowerCase().trim()}`);
    } else {
      return NextResponse.json({ success: false, message: 'repId or repName is required' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error updating representative in D1:', err);
    return NextResponse.json({ success: false, message: err?.message || 'Update failed' }, { status: 500 });
  }
}
