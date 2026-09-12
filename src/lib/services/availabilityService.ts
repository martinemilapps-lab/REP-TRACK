import { db, hospitals, productAvailabilities, products, representatives, users } from '@/lib/db';
import { eq, and, desc } from 'drizzle-orm';
import { UserSessionPayload, resolveAuthorizedRepId } from '@/lib/auth';
import { findOrCreateHospital, findOrCreateProduct } from './masterEntityService';
import { z } from 'zod';
import { ProductAvailabilitySchema, ProductAvailabilityBatchSchema } from '@/lib/validation';
import { FilterOptions } from './hospitalService';
import { assertAuthenticatedSession } from '@/lib/authPolicy';
import { resolveWritableRepId } from '@/lib/repAccessPolicy';
import { AppError } from '@/lib/errors';

export type ProductAvailabilityInput = z.input<typeof ProductAvailabilitySchema>;
export type ProductAvailabilityBatchInput = z.input<typeof ProductAvailabilityBatchSchema>;

export async function saveProductAvailabilityBatch(session: UserSessionPayload | null, rawInput: ProductAvailabilityBatchInput) {
  assertAuthenticatedSession(session);
  const input = ProductAvailabilityBatchSchema.parse(rawInput);
  const repId = resolveWritableRepId(session);
  const hospital = await db.select().from(hospitals).where(and(eq(hospitals.id, input.hospitalId), eq(hospitals.repId, repId))).get();
  if (!hospital) throw new AppError('Hospital is not in your saved list', 403);
  const activeProducts = await db.select({ id: products.id }).from(products).where(eq(products.isActive, true)).all();
  const activeIds = new Set(activeProducts.map((product) => product.id));
  if (input.items.some((item) => !activeIds.has(item.productId))) throw new AppError('Invalid or inactive product', 400);
  const submittedAt = new Date();
  const operations = input.items.map((item) => db.insert(productAvailabilities).values({
    repId, hospitalId: hospital.id, productId: item.productId, month: input.month,
    isAvailable: item.status === 'Available', notes: input.notes || null, submittedAt,
  }).onConflictDoUpdate({
    target: [productAvailabilities.repId, productAvailabilities.hospitalId, productAvailabilities.productId, productAvailabilities.month],
    set: { isAvailable: item.status === 'Available', notes: input.notes || null, submittedAt },
  }));
  const [first, ...rest] = operations;
  if (!first) throw new AppError('At least one product status is required', 400);
  await db.batch([first, ...rest]);
  return { hospitalName: hospital.name, savedCount: input.items.length };
}

/**
 * Upserts a monthly product availability snapshot.
 * Unique constraint: (rep_id, hospital_id, product_id, month).
 */
export async function upsertProductAvailability(
  session: UserSessionPayload | null,
  rawInput: ProductAvailabilityInput
) {
  assertAuthenticatedSession(session);
  const input = ProductAvailabilitySchema.parse(rawInput);
  const repId = resolveWritableRepId(session);

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
        annualTarget: input.annualTarget || 0,
        avgMonthlyTarget: input.avgMonthlyTarget || 0,
        salesUnits: input.monthlySales !== undefined && input.monthlySales !== 0 ? input.monthlySales : (input.sales || 0),
        potentiality: input.potentiality || 0,
        isAvailable: isAvail,
        objective: null,
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
        objective: null,
        month: cleanMonth,
        annualTarget: input.annualTarget || 0,
        avgMonthlyTarget: input.avgMonthlyTarget || 0,
        salesUnits: input.monthlySales !== undefined && input.monthlySales !== 0 ? input.monthlySales : (input.sales || 0),
        potentiality: input.potentiality || 0,
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
      hospitalType: hospitals.type,
      product: products.name,
      productCode: products.code,
      username: users.username,
      positionCode: users.positionCode,
      objective: productAvailabilities.objective,
      month: productAvailabilities.month,
      annualTarget: productAvailabilities.annualTarget,
      avgMonthlyTarget: productAvailabilities.avgMonthlyTarget,
      sales: productAvailabilities.salesUnits,
      potentiality: productAvailabilities.potentiality,
      isAvailable: productAvailabilities.isAvailable,
      notes: productAvailabilities.notes,
      submittedAt: productAvailabilities.submittedAt,
    })
    .from(productAvailabilities)
    .innerJoin(hospitals, eq(productAvailabilities.hospitalId, hospitals.id))
    .innerJoin(products, eq(productAvailabilities.productId, products.id))
    .innerJoin(representatives, eq(productAvailabilities.repId, representatives.id))
    .leftJoin(users, eq(users.repId, representatives.id))
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
        hospitalType: hospitals.type,
        product: products.name,
        productCode: products.code,
        username: users.username,
        positionCode: users.positionCode,
        objective: productAvailabilities.objective,
        month: productAvailabilities.month,
        annualTarget: productAvailabilities.annualTarget,
        avgMonthlyTarget: productAvailabilities.avgMonthlyTarget,
        sales: productAvailabilities.salesUnits,
        potentiality: productAvailabilities.potentiality,
        isAvailable: productAvailabilities.isAvailable,
        notes: productAvailabilities.notes,
        submittedAt: productAvailabilities.submittedAt,
      })
      .from(productAvailabilities)
      .innerJoin(hospitals, eq(productAvailabilities.hospitalId, hospitals.id))
      .innerJoin(products, eq(productAvailabilities.productId, products.id))
      .innerJoin(representatives, eq(productAvailabilities.repId, representatives.id))
      .leftJoin(users, eq(users.repId, representatives.id))
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

  return results.map((a) => {
    const sales = a.sales ?? 0;
    const avgMonthlyTarget = a.avgMonthlyTarget ?? 0;
    const annualTarget = a.annualTarget ?? 0;
    const potentiality = a.potentiality ?? 0;

    const salesPctAvgTarget = avgMonthlyTarget > 0 ? Math.round((sales / avgMonthlyTarget) * 100) : 0;
    const salesPctAnnualTarget = annualTarget > 0 ? Math.round((sales / annualTarget) * 100) : 0;
    const salesPctPotentiality = potentiality > 0 ? Math.round((sales / potentiality) * 100) : 0;

    return {
      ...a,
      monthlySales: sales,
      salesPctAvgTarget,
      salesPctAnnualTarget,
      salesPctPotentiality,
      status: a.isAvailable ? 'Available' : 'Not Available',
      submittedAt: a.submittedAt ? new Date(a.submittedAt).toISOString() : undefined,
    };
  });
}
