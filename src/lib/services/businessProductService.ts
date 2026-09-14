import { and, eq, inArray } from 'drizzle-orm';
import { db, products } from '@/lib/db';
import { BUSINESS_PRODUCT_OPTIONS } from '@/lib/constants';
import { AppError } from '@/lib/errors';

export async function requireBusinessProducts(productIds:string[]){
  if(new Set(productIds).size!==productIds.length)throw new AppError('Duplicate products are not allowed',400);
  const rows=await db.select({id:products.id,name:products.name}).from(products).where(and(eq(products.isActive,true),inArray(products.id,productIds))).all();
  const allowed=new Set(BUSINESS_PRODUCT_OPTIONS.map(item=>item.canonicalName.toLowerCase()));
  if(rows.length!==productIds.length||rows.some(row=>!allowed.has(row.name.trim().toLowerCase())))throw new AppError('Only approved business products may be selected',400);
  return new Map(rows.map(row=>[row.id,row.name]));
}
