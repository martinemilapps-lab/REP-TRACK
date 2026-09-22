import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth';
import { saveProductAvailabilityBatch, getScopedAvailabilityReports } from '@/lib/services/availabilityService';
import { handleApiError } from '@/lib/errors';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuthenticatedUser();
    const { searchParams } = new URL(req.url);
    const repId = searchParams.get('repId') || searchParams.get('rep') || undefined;
    const scopeMode = searchParams.get('scopeMode') === 'DIRECT_REPORTS' ? 'DIRECT_REPORTS' : 'ALL_DESCENDANTS';
    const month = searchParams.get('month') || undefined;

    const result = await getScopedAvailabilityReports(session, {
      repId,
      scopeMode,
      month,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuthenticatedUser();
    const rawData = await req.json();
    const result = await saveProductAvailabilityBatch(session, rawData);
    return NextResponse.json({ success: true, message: 'Product availability saved', ...result });
  } catch (error) {
    return handleApiError(error);
  }
}
