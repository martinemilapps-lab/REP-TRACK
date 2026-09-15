import { NextRequest,NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth';
import { getCycleCoverage } from '@/lib/services/coverageService';
import { handleApiError } from '@/lib/errors';
export async function GET(request:NextRequest){try{const session=await requireAuthenticatedUser();const p=request.nextUrl.searchParams;const repId=p.get('repId')||session.repId;if(!repId)return NextResponse.json({message:'Representative is required'},{status:400});const now=new Date(),end=p.get('endDate')||now.toLocaleDateString('en-CA',{timeZone:'Africa/Cairo'}),start=p.get('startDate')||`${end.slice(0,8)}01`;return NextResponse.json({success:true,coverage:await getCycleCoverage(session,repId,start,end)},{headers:{'Cache-Control':'private, no-store'}});}catch(error){return handleApiError(error)}}
