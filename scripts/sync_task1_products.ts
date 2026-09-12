import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { db, products } from '../src/lib/db';
import { PRODUCTS_LIST } from '../src/lib/constants';
import { eq, inArray, notInArray } from 'drizzle-orm';

async function main() {
  let inserted = 0;
  for (const name of PRODUCTS_LIST) {
    const existing = await db.select({ id: products.id }).from(products).where(eq(products.name, name)).get();
    if (!existing) { await db.insert(products).values({ name, isActive: true }); inserted += 1; }
  }
  await db.update(products).set({ isActive: true }).where(inArray(products.name, PRODUCTS_LIST));
  await db.update(products).set({ isActive: false }).where(notInArray(products.name, PRODUCTS_LIST));
  const active = await db.select({ id: products.id }).from(products).where(eq(products.isActive, true)).all();
  console.log(JSON.stringify({ canonicalCount: PRODUCTS_LIST.length, inserted, activeCount: active.length }));
}
main().catch((error) => { console.error(error instanceof Error ? error.message : 'Product sync failed'); process.exit(1); });
