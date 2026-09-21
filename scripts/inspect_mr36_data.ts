import { db, doctors, pharmacies, hospitals, distributionBranches, doctorVisits, pharmacyVisits, hospitalVisits, branchVisits, weeklyPlans, representativeVisitRates } from '@/lib/db';
import { eq } from 'drizzle-orm';

async function main() {
  const repId = 'rep-mr36';
  const [
    drList,
    phList,
    hospList,
    brList,
    drV,
    phV,
    hospV,
    brV,
    plans,
    vRates,
  ] = await Promise.all([
    db.select().from(doctors).where(eq(doctors.repId, repId)),
    db.select().from(pharmacies).where(eq(pharmacies.repId, repId)),
    db.select().from(hospitals).where(eq(hospitals.repId, repId)),
    db.select().from(distributionBranches).where(eq(distributionBranches.repId, repId)),
    db.select().from(doctorVisits).where(eq(doctorVisits.repId, repId)),
    db.select().from(pharmacyVisits).where(eq(pharmacyVisits.repId, repId)),
    db.select().from(hospitalVisits).where(eq(hospitalVisits.repId, repId)),
    db.select().from(branchVisits).where(eq(branchVisits.repId, repId)),
    db.select().from(weeklyPlans).where(eq(weeklyPlans.repId, repId)),
    db.select().from(representativeVisitRates).where(eq(representativeVisitRates.repId, repId)),
  ]);

  console.log(`\n=== DATA AUDIT FOR MR36 (${repId}) ===`);
  console.log(`My Lists:`);
  console.log(`  - Doctors: ${drList.length}`);
  console.log(`  - Pharmacies: ${phList.length}`);
  console.log(`  - Hospitals: ${hospList.length}`);
  console.log(`  - Branches: ${brList.length}`);
  console.log(`\nVisits Submitted:`);
  console.log(`  - Doctor Visits: ${drV.length}`);
  console.log(`  - Pharmacy Visits: ${phV.length}`);
  console.log(`  - Hospital Visits: ${hospV.length}`);
  console.log(`  - Branch Visits: ${brV.length}`);
  console.log(`\nWeekly Plans: ${plans.length}`);
  console.log(`\nVisit Rates entered by BUM: ${vRates.length}`);
  if (vRates.length > 0) {
    console.log('Latest visit rate:', vRates[vRates.length - 1]);
  }
}

main().catch(console.error);
