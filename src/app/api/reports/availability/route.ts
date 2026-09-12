import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth';
import { saveProductAvailabilityBatch } from '@/lib/services/availabilityService';
import { handleApiError } from '@/lib/errors';

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
