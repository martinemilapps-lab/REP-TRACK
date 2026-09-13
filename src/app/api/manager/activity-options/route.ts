import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth';
import { getManagerActivityOptions } from '@/lib/services/managerActivityService';
import { handleApiError } from '@/lib/errors';
export async function GET(){try{return NextResponse.json(await getManagerActivityOptions(await requireAuthenticatedUser()));}catch(error){return handleApiError(error);}}
