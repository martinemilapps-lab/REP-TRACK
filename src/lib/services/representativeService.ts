import { db, representatives, hospitalVisits, pharmacyVisits, doctorVisits } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';
import { calculateCoverage, RepCoverageResult } from '@/lib/business/coverage';
import { INITIAL_REPRESENTATIVES } from '@/lib/constants';

/**
 * Retrieves all active representatives from Turso.
 * If database is newly provisioned, automatically populates INITIAL_REPRESENTATIVES.
 */
export async function getAllRepresentatives() {
  try {
    const existing = await db
      .select()
      .from(representatives)
      .where(eq(representatives.isActive, true))
      .all();

    if (existing && existing.length >= INITIAL_REPRESENTATIVES.length) {
      return existing;
    }

    // Ensure all 19 initial representatives are inserted
    for (const rep of INITIAL_REPRESENTATIVES) {
      const found = existing?.find((r) => r.name.toLowerCase() === rep.name.toLowerCase());
      if (!found) {
        try {
          await db
            .insert(representatives)
            .values({
              id: rep.id,
              name: rep.name,
              area: rep.area,
              assignedHospitals: rep.assignedHospitals,
              assignedPharmacies: rep.assignedPharmacies,
              assignedDrs: rep.assignedDrs,
              isActive: true,
            })
            .onConflictDoNothing();
        } catch {
          // ignore conflict
        }
      }
    }

    const allReps = await db
      .select()
      .from(representatives)
      .where(eq(representatives.isActive, true))
      .all();

    return allReps && allReps.length > 0 ? allReps : INITIAL_REPRESENTATIVES;
  } catch (err) {
    console.warn('Fallback to INITIAL_REPRESENTATIVES:', err);
    return INITIAL_REPRESENTATIVES;
  }
}

/**
 * Computes coverage for a single representative based on DISTINCT visited institutions.
 */
export async function getRepresentativeCoverage(repId: string): Promise<RepCoverageResult | null> {
  const rep = await db
    .select()
    .from(representatives)
    .where(eq(representatives.id, repId))
    .get();

  if (!rep) return null;

  const [hospRes, pharmRes, drRes] = await Promise.all([
    db
      .select({ count: sql<number>`count(distinct ${hospitalVisits.hospitalId})` })
      .from(hospitalVisits)
      .where(eq(hospitalVisits.repId, rep.id))
      .get(),
    db
      .select({ count: sql<number>`count(distinct ${pharmacyVisits.pharmacyId})` })
      .from(pharmacyVisits)
      .where(eq(pharmacyVisits.repId, rep.id))
      .get(),
    db
      .select({ count: sql<number>`count(distinct ${doctorVisits.doctorId})` })
      .from(doctorVisits)
      .where(eq(doctorVisits.repId, rep.id))
      .get(),
  ]);

  return calculateCoverage(
    {
      repId: rep.id,
      repName: rep.name,
      area: rep.area,
      assignedHospitals: rep.assignedHospitals,
      assignedPharmacies: rep.assignedPharmacies,
      assignedDrs: rep.assignedDrs,
    },
    {
      hospitals: hospRes?.count || 0,
      pharmacies: pharmRes?.count || 0,
      doctors: drRes?.count || 0,
    }
  );
}

/**
 * Computes coverage for all representatives in parallel with distinct counting.
 */
export async function getAllRepresentativesCoverage(): Promise<RepCoverageResult[]> {
  const allReps = await getAllRepresentatives();

  return await Promise.all(
    allReps.map(async (rep) => {
      const [hospRes, pharmRes, drRes] = await Promise.all([
        db
          .select({ count: sql<number>`count(distinct ${hospitalVisits.hospitalId})` })
          .from(hospitalVisits)
          .where(eq(hospitalVisits.repId, rep.id))
          .get(),
        db
          .select({ count: sql<number>`count(distinct ${pharmacyVisits.pharmacyId})` })
          .from(pharmacyVisits)
          .where(eq(pharmacyVisits.repId, rep.id))
          .get(),
        db
          .select({ count: sql<number>`count(distinct ${doctorVisits.doctorId})` })
          .from(doctorVisits)
          .where(eq(doctorVisits.repId, rep.id))
          .get(),
      ]);

      return calculateCoverage(
        {
          repId: rep.id,
          repName: rep.name,
          area: rep.area,
          assignedHospitals: rep.assignedHospitals,
          assignedPharmacies: rep.assignedPharmacies,
          assignedDrs: rep.assignedDrs,
        },
        {
          hospitals: hospRes?.count || 0,
          pharmacies: pharmRes?.count || 0,
          doctors: drRes?.count || 0,
        }
      );
    })
  );
}
