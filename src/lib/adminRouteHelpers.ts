import type { NextRequest } from 'next/server';
export const pageInput=(request:NextRequest)=>({search:request.nextUrl.searchParams.get('search')??undefined,page:Number(request.nextUrl.searchParams.get('page')||1),pageSize:Number(request.nextUrl.searchParams.get('pageSize')||20)});
