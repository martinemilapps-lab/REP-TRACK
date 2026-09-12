import { db, pharmacies, pharmacyVisits, representatives } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { UserSessionPayload, resolveAuthorizedRepId } from '@/lib/auth';
import { findOrCreatePharmacy } from './masterEntityService';
import { deriveVisitStatus } from '@/lib/business/status';
import { z } from 'zod';
import { PharmacyVisitSchema } from '@/lib/validation';
import { FilterOptions } from './hospitalService';
import { assertAuthenticatedSession } from '@/lib/authPolicy';
import { resolveWritableRepId } from '@/lib/repAccessPolicy';

export type PharmacyVisitInput = z.input<typeof PharmacyVisitSchema>;

/**
 * Creates a new pharmacy visit historical log.
 */
export async function createPharmacyVisit(
  session: UserSessionPayload | null,
  rawInput: PharmacyVisitInput
) {
  assertAuthenticatedSession(session);
  const input = PharmacyVisitSchema.parse(rawInput);
  const repId = resolveWritableRepId(session);

  const pharmacy = await findOrCreatePharmacy({
    name: input.name,
    area: input.area,
    address: input.address,
    pharmacist: input.pharmacist,
    mobile: input.mobile,
    classification: input.cls,
    repId,
  });

  const [visit] = await db
    .insert(pharmacyVisits)
    .values({
      repId,
      pharmacyId: pharmacy.id,
      objective: input.objective || null,
      objectiveOtherText: input.objective.match(/(?:^|[،,]\s*)Others:\s*(.+?)(?=$|[،,])/i)?.[1]?.trim() || null,
      cycleDays: input.cycle || 0,
      lastVisitDate: input.lastVisit || null,
      nextVisitDate: input.nextVisit || null,
      visitType: input.visitType || 'Single',
      companion: input.companion || null,
      ourProducts: input.ourProducts || null,
      stockPerMonth: input.stockPerMonth || null,
      salesPerMonth: input.salesPerMonth || null,
      competitor: input.competitor || null,
      notes: input.notes || null,
    })
    .returning();

  const computedStatus = deriveVisitStatus({
    lastVisitDate: input.lastVisit,
    nextVisitDate: input.nextVisit,
    cycleDays: input.cycle,
  });

  return {
    ...visit,
    pharmacyName: pharmacy.name,
    area: pharmacy.area,
    address: pharmacy.address,
    pharmacist: pharmacy.pharmacist,
    mobile: pharmacy.mobile,
    cls: pharmacy.classification,
    stockPerMonth: visit.stockPerMonth,
    salesPerMonth: visit.salesPerMonth,
    status: computedStatus,
  };
}

/**
 * Retrieves pharmacy visit reports scoped by role & ownership.
 */
export async function getPharmacyReports(
  session: UserSessionPayload | null,
  options: FilterOptions = {}
) {
  const targetRepId = resolveAuthorizedRepId(session, options.repId);

  const query = db
    .select({
      id: pharmacyVisits.id,
      repId: pharmacyVisits.repId,
      rep: representatives.name,
      name: pharmacies.name,
      area: pharmacies.area,
      address: pharmacies.address,
      objective: pharmacyVisits.objective,
      pharmacist: pharmacies.pharmacist,
      mobile: pharmacies.mobile,
      cls: pharmacies.classification,
      cycle: pharmacyVisits.cycleDays,
      lastVisit: pharmacyVisits.lastVisitDate,
      nextVisit: pharmacyVisits.nextVisitDate,
      visitType: pharmacyVisits.visitType,
      companion: pharmacyVisits.companion,
      ourProducts: pharmacyVisits.ourProducts,
      stockPerMonth: pharmacyVisits.stockPerMonth,
      salesPerMonth: pharmacyVisits.salesPerMonth,
      competitor: pharmacyVisits.competitor,
      notes: pharmacyVisits.notes,
      submittedAt: pharmacyVisits.submittedAt,
    })
    .from(pharmacyVisits)
    .innerJoin(pharmacies, eq(pharmacyVisits.pharmacyId, pharmacies.id))
    .innerJoin(representatives, eq(pharmacyVisits.repId, representatives.id))
    .orderBy(desc(pharmacyVisits.submittedAt));

  let results;
  if (targetRepId) {
    results = await db
      .select({
        id: pharmacyVisits.id,
        repId: pharmacyVisits.repId,
        rep: representatives.name,
        name: pharmacies.name,
        area: pharmacies.area,
        address: pharmacies.address,
        objective: pharmacyVisits.objective,
        pharmacist: pharmacies.pharmacist,
        mobile: pharmacies.mobile,
        cls: pharmacies.classification,
        cycle: pharmacyVisits.cycleDays,
        lastVisit: pharmacyVisits.lastVisitDate,
        nextVisit: pharmacyVisits.nextVisitDate,
        visitType: pharmacyVisits.visitType,
        companion: pharmacyVisits.companion,
        ourProducts: pharmacyVisits.ourProducts,
        stockPerMonth: pharmacyVisits.stockPerMonth,
        salesPerMonth: pharmacyVisits.salesPerMonth,
        competitor: pharmacyVisits.competitor,
        notes: pharmacyVisits.notes,
        submittedAt: pharmacyVisits.submittedAt,
      })
      .from(pharmacyVisits)
      .innerJoin(pharmacies, eq(pharmacyVisits.pharmacyId, pharmacies.id))
      .innerJoin(representatives, eq(pharmacyVisits.repId, representatives.id))
      .where(eq(pharmacyVisits.repId, targetRepId))
      .orderBy(desc(pharmacyVisits.submittedAt))
      .limit(options.limit || 1000)
      .offset(options.offset || 0)
      .all();
  } else {
    results = await query
      .limit(options.limit || 1000)
      .offset(options.offset || 0)
      .all();
  }

  return results.map((p) => ({
    ...p,
    status: deriveVisitStatus({
      lastVisitDate: p.lastVisit,
      nextVisitDate: p.nextVisit,
      cycleDays: p.cycle,
    }),
    submittedAt: p.submittedAt ? new Date(p.submittedAt).toISOString() : undefined,
  }));
}

/**
 * Retrieves the latest visit state for each distinct pharmacy.
 */
export async function getLatestPharmacyVisits(session: UserSessionPayload | null) {
  const allReports = await getPharmacyReports(session);
  const map = new Map<string, (typeof allReports)[0]>();

  for (const report of allReports) {
    const key = `${report.name}__${report.area}`;
    if (!map.has(key)) {
      map.set(key, report);
    }
  }

  return Array.from(map.values());
}
