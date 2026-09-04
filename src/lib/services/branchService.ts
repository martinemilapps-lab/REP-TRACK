import { db, distributionBranches, branchVisits, representatives } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { UserSessionPayload, resolveAuthorizedRepId } from '@/lib/auth';
import { findOrCreateBranch } from './masterEntityService';
import { AppError } from '@/lib/errors';
import { z } from 'zod';
import { BranchVisitSchema } from '@/lib/validation';
import { FilterOptions } from './hospitalService';

export type BranchVisitInput = z.input<typeof BranchVisitSchema>;

/**
 * Creates a new distribution branch visit historical log.
 */
export async function createBranchVisit(
  session: UserSessionPayload | null,
  rawInput: BranchVisitInput
) {
  const input = BranchVisitSchema.parse(rawInput);
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

  const branch = await findOrCreateBranch({
    name: input.name,
    coverageArea: input.area,
    contact: input.contact,
    phone: input.phone,
    distributedProducts: input.products,
  });

  const [visit] = await db
    .insert(branchVisits)
    .values({
      repId,
      branchId: branch.id,
      objective: input.objective || null,
      cycleDays: input.cycle || 0,
      lastVisitDate: input.lastVisit || null,
      nextVisitDate: input.nextVisit || null,
      visitType: input.visitType || 'Single',
      companion: input.companion || null,
      products: input.products || null,
      monthlyStock: input.monthlyStock || null,
      monthlySales: input.monthlySales || null,
      notes: input.notes || null,
    })
    .returning();

  return {
    ...visit,
    branchName: branch.name,
    coverageArea: branch.coverageArea,
    contact: branch.contact,
    phone: branch.phone,
    products: visit.products || branch.distributedProducts,
    monthlyStock: visit.monthlyStock,
    monthlySales: visit.monthlySales,
    cycle: input.cycle || 0,
    nextVisit: input.nextVisit || null,
    status: 'Visited',
  };
}

/**
 * Retrieves branch visit reports scoped by role & ownership.
 */
export async function getBranchReports(
  session: UserSessionPayload | null,
  options: FilterOptions = {}
) {
  const targetRepId = resolveAuthorizedRepId(session, options.repId);

  const query = db
    .select({
      id: branchVisits.id,
      repId: branchVisits.repId,
      rep: representatives.name,
      name: distributionBranches.name,
      area: distributionBranches.coverageArea,
      objective: branchVisits.objective,
      contact: distributionBranches.contact,
      phone: distributionBranches.phone,
      products: branchVisits.products,
      monthlyStock: branchVisits.monthlyStock,
      monthlySales: branchVisits.monthlySales,
      cycle: branchVisits.cycleDays,
      lastVisit: branchVisits.lastVisitDate,
      nextVisit: branchVisits.nextVisitDate,
      visitType: branchVisits.visitType,
      companion: branchVisits.companion,
      notes: branchVisits.notes,
      submittedAt: branchVisits.submittedAt,
    })
    .from(branchVisits)
    .innerJoin(distributionBranches, eq(branchVisits.branchId, distributionBranches.id))
    .innerJoin(representatives, eq(branchVisits.repId, representatives.id))
    .orderBy(desc(branchVisits.submittedAt));

  let results;
  if (targetRepId) {
    results = await db
      .select({
        id: branchVisits.id,
        repId: branchVisits.repId,
        rep: representatives.name,
        name: distributionBranches.name,
        area: distributionBranches.coverageArea,
        objective: branchVisits.objective,
        contact: distributionBranches.contact,
        phone: distributionBranches.phone,
        products: branchVisits.products,
        monthlyStock: branchVisits.monthlyStock,
        monthlySales: branchVisits.monthlySales,
        cycle: branchVisits.cycleDays,
        lastVisit: branchVisits.lastVisitDate,
        nextVisit: branchVisits.nextVisitDate,
        visitType: branchVisits.visitType,
        companion: branchVisits.companion,
        notes: branchVisits.notes,
        submittedAt: branchVisits.submittedAt,
      })
      .from(branchVisits)
      .innerJoin(distributionBranches, eq(branchVisits.branchId, distributionBranches.id))
      .innerJoin(representatives, eq(branchVisits.repId, representatives.id))
      .where(eq(branchVisits.repId, targetRepId))
      .orderBy(desc(branchVisits.submittedAt))
      .limit(options.limit || 1000)
      .offset(options.offset || 0)
      .all();
  } else {
    results = await query
      .limit(options.limit || 1000)
      .offset(options.offset || 0)
      .all();
  }

  return results.map((b) => ({
    ...b,
    status: 'Visited',
    submittedAt: b.submittedAt ? new Date(b.submittedAt).toISOString() : undefined,
  }));
}
