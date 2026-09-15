import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth';
import { getManagerActivityOptions } from '@/lib/services/managerActivityService';
import { handleApiError } from '@/lib/errors';
export async function GET(request:Request){try{return NextResponse.json(await getManagerActivityOptions(await requireAuthenticatedUser(),new URL(request.url).searchParams.get('repId')||undefined));}catch(error){return handleApiError(error);}}
