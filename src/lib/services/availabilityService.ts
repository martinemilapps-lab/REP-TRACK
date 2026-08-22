import { db, hospitals, productAvailabilities, products, representatives } from '@/lib/db';
import { eq, and, desc } from 'drizzle-orm';
import { UserSessionPayload, resolveAuthorizedRepId } from '@/lib/auth';
import { findOrCreateHospital, findOrCreateProduct } from './masterEntityService';
import { AppError } from '@/lib/errors';
import { z } from 'zod';
import { ProductAvailabilitySchema } from '@/lib/validation';
import { FilterOptions } from './hospitalService';

export type ProductAvailabilityInput = z.input<typeof ProductAvailabilitySchema>;

/**
 * Upserts a monthly product availability snapshot.
 * Unique constraint: (rep_id, hospital_id, product_id, month).
 */
export async function upsertProductAvailability(
  session: UserSessionPayload | null,
  rawInput: ProductAvailabilityInput
) {
  const input = ProductAvailabilitySchema.parse(rawInput);
  let repId = session?.repId || null;

  if (!repId && input.rep) {
    const foundRep = await db
      .select()
      .from(representatives)
      .where(eq(representatives.name, input.rep.trim()))
      .get();
    if (foundRep) {
      repId = foundRep.id;
    }
  }

  if (!repId) {
    const firstRep = await db.select().from(representatives).limit(1).get();
    if (!firstRep) {
      throw new AppError('لم يتم العثور على المندوب. يرجى تسجيل الدخول أولاً', 401);
    }
    repId = firstRep.id;
  }

  // 1. Resolve Master Hospital
  const hospital = await findOrCreateHospital({
    name: input.hospital,
    area: input.area,
  });

  // 2. Resolve Master Product
  const product = await findOrCreateProduct(input.product);

  const cleanMonth = input.month.trim();
  const isAvail = (input.status || 'Available').toLowerCase() !== 'not available';

  // 3. Check existing monthly snapshot
  const existing = await db
    .select()
    .from(productAvailabilities)
    .where(
      and(
        eq(productAvailabilities.repId, repId),
        eq(productAvailabilities.hospitalId, hospital.id),
        eq(productAvailabilities.productId, product.id),
        eq(productAvailabilities.month, cleanMonth)
      )
    )
    .get();

  let record;
  let isUpdate = false;

  if (existing) {
    const updated = await db
      .update(productAvailabilities)
      .set({
        salesUnits: input.sales || 0,
        isAvailable: isAvail,
        notes: input.notes || null,
        submittedAt: new Date(),
      })
      .where(eq(productAvailabilities.id, existing.id))
      .returning();
    record = updated[0];
    isUpdate = true;
  } else {
    const inserted = await db
      .insert(productAvailabilities)
      .values({
        repId,
        hospitalId: hospital.id,
        productId: product.id,
        month: cleanMonth,
        salesUnits: input.sales || 0,
        isAvailable: isAvail,
        notes: input.notes || null,
      })
      .returning();
    record = inserted[0];
  }

  return {
    record,
    isUpdate,
    hospitalName: hospital.name,
    productName: product.name,
    area: hospital.area,
    status: isAvail ? 'Available' : 'Not Available',
  };
}

/**
 * Retrieves product availability reports scoped by role & ownership.
 */
export async function getProductAvailabilityReports(
  session: UserSessionPayload | null,
  options: FilterOptions = {}
) {
  const targetRepId = resolveAuthorizedRepId(session, options.repId);

  const query = db
    .select({
      id: productAvailabilities.id,
      repId: productAvailabilities.repId,
      rep: representatives.name,
      hospital: hospitals.name,
      area: hospitals.area,
      product: products.name,
      month: productAvailabilities.month,
      sales: productAvailabilities.salesUnits,
      isAvailable: productAvailabilities.isAvailable,
      notes: productAvailabilities.notes,
      submittedAt: productAvailabilities.submittedAt,
    })
    .from(productAvailabilities)
    .innerJoin(hospitals, eq(productAvailabilities.hospitalId, hospitals.id))
    .innerJoin(products, eq(productAvailabilities.productId, products.id))
    .innerJoin(representatives, eq(productAvailabilities.repId, representatives.id))
    .orderBy(desc(productAvailabilities.submittedAt));

  let results;
  if (targetRepId) {
    results = await db
      .select({
        id: productAvailabilities.id,
        repId: productAvailabilities.repId,
        rep: representatives.name,
        hospital: hospitals.name,
        area: hospitals.area,
        product: products.name,
        month: productAvailabilities.month,
        sales: productAvailabilities.salesUnits,
        isAvailable: productAvailabilities.isAvailable,
        notes: productAvailabilities.notes,
        submittedAt: productAvailabilities.submittedAt,
      })
      .from(productAvailabilities)
      .innerJoin(hospitals, eq(productAvailabilities.hospitalId, hospitals.id))
      .innerJoin(products, eq(productAvailabilities.productId, products.id))
      .innerJoin(representatives, eq(productAvailabilities.repId, representatives.id))
      .where(eq(productAvailabilities.repId, targetRepId))
      .orderBy(desc(productAvailabilities.submittedAt))
      .limit(options.limit || 1000)
      .offset(options.offset || 0)
      .all();
  } else {
    results = await query
      .limit(options.limit || 1000)
      .offset(options.offset || 0)
      .all();
  }

  return results.map((a) => ({
    ...a,
    status: a.isAvailable ? 'Available' : 'Not Available',
    submittedAt: a.submittedAt ? new Date(a.submittedAt).toISOString() : undefined,
  }));
}
