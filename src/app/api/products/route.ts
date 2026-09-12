import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth';
import { db, products } from '@/lib/db';
import { asc, eq } from 'drizzle-orm';
import { handleApiError } from '@/lib/errors';

export async function GET() {
  try {
    await requireAuthenticatedUser();
    const rows = await db.select({ id: products.id, name: products.name, code: products.code })
      .from(products).where(eq(products.isActive, true)).orderBy(asc(products.createdAt), asc(products.name)).all();
    return NextResponse.json({ success: true, products: rows }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return handleApiError(error); }
}
