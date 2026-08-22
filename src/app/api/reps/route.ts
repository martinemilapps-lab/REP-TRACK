import { NextResponse } from 'next/server';
import {
  getAllRepresentatives,
  getAllRepresentativesCoverage,
} from '@/lib/services/representativeService';
import { INITIAL_REPRESENTATIVES } from '@/lib/constants';

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
