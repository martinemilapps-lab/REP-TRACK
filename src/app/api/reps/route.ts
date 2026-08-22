import { NextResponse } from 'next/server';
import {
  getAllRepresentatives,
  getAllRepresentativesCoverage,
} from '@/lib/services/representativeService';
import { handleApiError } from '@/lib/errors';

export async function GET() {
  try {
    const [allReps, coverageSummaries] = await Promise.all([
      getAllRepresentatives(),
      getAllRepresentativesCoverage(),
    ]);

    return NextResponse.json({
      reps: allReps,
      coverage: coverageSummaries,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
