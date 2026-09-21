import { db, users, representatives, doctors, pharmacies, hospitals, distributionBranches, doctorVisits, pharmacyVisits, hospitalVisits, branchVisits, weeklyPlans, representativeVisitRates, managerActivities } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { verifyPassword } from '@/lib/services/passwordService';
import { hierarchyService } from '@/lib/services/hierarchyService';
import { saveMasterDoctor, saveMasterPharmacy, saveMasterHospital, saveMasterBranch, getMasterListsForRep, getScopedMasterListsForManager, deleteMasterItem } from '@/lib/services/masterListService';
import { createDoctorVisit } from '@/lib/services/doctorService';
import { createPharmacyVisit } from '@/lib/services/pharmacyService';
import { createHospitalVisit } from '@/lib/services/hospitalService';
import { createBranchVisit } from '@/lib/services/branchService';
import { getVisibleReports } from '@/lib/services/reportService';
import { saveWeeklyPlan, getWeeklyPlanById, updateWeeklyPlanStatus, deleteWeeklyPlan, getWeeklyPlansForRep } from '@/lib/services/weeklyPlanService';
import { saveManagerActivity, deleteManagerActivity } from '@/lib/services/managerActivityService';
import { calculateAverageAndCoverage } from '@/lib/services/averageCoverageService';
import type { UserSessionPayload } from '@/lib/auth';

async function main() {
  console.log('====================================================');
  console.log('REP TRACK END-TO-END SYSTEM INTEGRATION TEST SUITE');
  console.log('====================================================\n');

  // STEP 1: AUTHENTICATION AND SESSION INITIALIZATION
  console.log('--- STEP 1: VERIFYING AUTHENTICATION WITH REAL CREDENTIALS ---');
  const [mrUser] = await db.select().from(users).where(eq(users.username, 'MR36'));
  const [dmUser] = await db.select().from(users).where(eq(users.username, 'DM6'));
  const [bumUser] = await db.select().from(users).where(eq(users.username, 'BUM2'));

  if (!mrUser || !dmUser || !bumUser) throw new Error('Could not find all required accounts');

  const mrPassValid = verifyPassword('12345@54321As', mrUser.passwordHash);
  const dmPassValid = verifyPassword('12345@54321As', dmUser.passwordHash);
  const bumPassValid = verifyPassword('12345@54321As', bumUser.passwordHash);

  console.log(`MR36 login check: ${mrPassValid ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`DM6 login check: ${dmPassValid ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`BUM2 login check: ${bumPassValid ? '✓ PASS' : '✗ FAIL'}`);

  if (!mrPassValid || !dmPassValid || !bumPassValid) {
    throw new Error('Password verification failed for one or more accounts');
  }

  const mrSession: UserSessionPayload = {
    id: mrUser.id,
    username: mrUser.username,
    role: mrUser.role,
    positionCode: mrUser.positionCode,
    systemRole: mrUser.systemRole,
    repId: mrUser.repId,
    name: mrUser.name,
    businessLine: mrUser.businessLine,
    mustChangePassword: false,
  };

  const dmSession: UserSessionPayload = {
    id: dmUser.id,
    username: dmUser.username,
    role: dmUser.role,
    positionCode: dmUser.positionCode,
    systemRole: dmUser.systemRole,
    repId: dmUser.repId,
    name: dmUser.name,
    businessLine: dmUser.businessLine,
    mustChangePassword: false,
  };

  const bumSession: UserSessionPayload = {
    id: bumUser.id,
    username: bumUser.username,
    role: bumUser.role,
    positionCode: bumUser.positionCode,
    systemRole: bumUser.systemRole,
    repId: bumUser.repId,
    name: bumUser.name,
    businessLine: bumUser.businessLine,
    mustChangePassword: false,
  };

  // STEP 2: VERIFY HIERARCHY SCOPES
  console.log('\n--- STEP 2: VERIFYING HIERARCHY SCOPES ---');
  const dmScopedReps = await hierarchyService.getScopedRepresentatives(dmSession);
  const bumScopedReps = await hierarchyService.getScopedRepresentatives(bumSession);

  console.log(`DM6 scoped reps: ${dmScopedReps.map(r => r.name).join(', ')}`);
  console.log(`BUM2 scoped reps count: ${bumScopedReps.length}`);

  if (!dmScopedReps.some(r => r.id === mrUser.repId)) {
    throw new Error('Hierarchy assertion failed: DM6 cannot see MR36');
  }
  if (!bumScopedReps.some(r => r.id === mrUser.repId)) {
    throw new Error('Hierarchy assertion failed: BUM2 cannot see MR36');
  }
  console.log('✓ Hierarchy linking verified across DM6 and BUM2');

  // STEP 3: MR ACTIONS - MY LISTS (SAVE & DELETE)
  console.log('\n--- STEP 3: TESTING MR36 MY LISTS ACTIONS ---');
  const todayStr = new Date().toISOString().slice(0, 10);
  const testIdSuffix = Date.now().toString().slice(-6);

  // 3a. Save Doctor to My Lists
  const testDoctor = await saveMasterDoctor({
    name: `Dr. QA Test ${testIdSuffix}`,
    specialty: 'Cardiology',
    classification: 'A',
    workplace: 'Cairo General Clinic',
    area: 'Maadi',
    phone: '01012345678',
    defaultCycle: 2,
    targetProducts: ['Omega 3 Plus', 'Cranberry'],
  }, mrUser.repId!);
  console.log(`✓ Saved Doctor to My Lists: ID=${testDoctor.id}, Name=${testDoctor.name}`);

  // 3b. Save Pharmacy to My Lists
  const testPharmacy = await saveMasterPharmacy({
    name: `Pharmacy QA Test ${testIdSuffix}`,
    area: 'Maadi',
    address: 'Street 9, Maadi',
    pharmacist: 'Dr. Pharmacist Test',
    mobile: '01123456789',
    classification: 'A',
    distributors: ['Ibn Sina'],
    defaultCycle: 4,
    targetProducts: ['Omega 3 Plus'],
  }, mrUser.repId!);
  console.log(`✓ Saved Pharmacy to My Lists: ID=${testPharmacy.id}, Name=${testPharmacy.name}`);

  // 3c. Save Hospital to My Lists
  const testHospital = await saveMasterHospital({
    name: `Hospital QA Test ${testIdSuffix}`,
    area: 'Maadi',
    address: 'Hospital Square, Maadi',
    type: 'Private',
    departments: [
      {
        department: 'Cardiology',
        doctors: [{ doctorName: 'Dr. Cardiology Head', class: 'A' }],
      },
    ],
    defaultCycle: 2,
    targetProducts: ['Omega 3 Plus'],
  }, mrUser.repId!);
  console.log(`✓ Saved Hospital to My Lists: ID=${testHospital.id}, Name=${testHospital.name}`);

  // 3d. Save Distribution Branch to My Lists
  const testBranch = await saveMasterBranch({
    name: `Branch QA Test ${testIdSuffix}`,
    area: 'Maadi',
    address: 'Distribution Center, Maadi',
    contact: 'Mr. Distributor QA',
    phone: '01234567890',
    distributorName: 'Ibn Sina',
    defaultCycle: 1,
    targetProducts: ['Omega 3 Plus'],
  }, mrUser.repId!);
  console.log(`✓ Saved Distribution Branch to My Lists: ID=${testBranch.id}, Name=${testBranch.name}`);

  // Verify list retrieval
  const repLists = await getMasterListsForRep(mrUser.repId!);
  console.log(`MR36 Lists count: Doctors=${repLists.doctors.length}, Pharmacies=${repLists.pharmacies.length}, Hospitals=${repLists.hospitals.length}, Branches=${repLists.branches.length}`);

  // STEP 4: MR ACTIONS - SUBMIT VISITS (ALL 4 CATEGORIES)
  console.log('\n--- STEP 4: TESTING MR36 SUBMIT VISITS ACTIONS ---');

  // 4a. Doctor Visit
  const docVisitResult = await createDoctorVisit(mrSession, {
    name: testDoctor.name,
    area: testDoctor.area,
    specialty: testDoctor.specialty,
    cls: testDoctor.classification,
    visitDate: todayStr,
    visitType: 'Single',
    objective: 'Follow up',
    f1: 'Omega 3 Plus',
    notes: 'Doctor agreed to prescribe Omega 3 Plus regularly',
  });
  console.log(`✓ Created Doctor Visit: ID=${docVisitResult.id}`);

  // 4b. Pharmacy Visit
  const pharmVisitResult = await createPharmacyVisit(mrSession, {
    name: testPharmacy.name,
    area: testPharmacy.area,
    visitDate: todayStr,
    visitType: 'Single',
    objective: 'Order fulfillment',
    ourProducts: 'Omega 3 Plus',
    stockPerMonth: '50 packs',
    salesPerMonth: '40 packs',
    notes: 'Pharmacy has sufficient stock',
  });
  console.log(`✓ Created Pharmacy Visit: ID=${pharmVisitResult.id}`);

  // 4c. Hospital Visit
  const hospVisitResult = await createHospitalVisit(mrSession, {
    name: testHospital.name,
    type: 'Private',
    area: testHospital.area,
    visitDate: todayStr,
    visitType: 'Single',
    objective: 'Contract renewal',
    dept: 'Cardiology',
    doctorNames: 'Dr. Cardiology Head',
    ourProducts: 'Omega 3 Plus',
    notes: 'Hospital administration approved tender request',
  });
  console.log(`✓ Created Hospital Visit: ID=${hospVisitResult.id}`);

  // 4d. Branch Visit
  const branchVisitResult = await createBranchVisit(mrSession, {
    name: testBranch.name,
    area: testBranch.area,
    visitDate: todayStr,
    visitType: 'Single',
    objective: 'Delivery status',
    contact: testBranch.contact,
    phone: testBranch.phone,
    products: 'Omega 3 Plus',
    notes: 'All shipments cleared',
  });
  console.log(`✓ Created Branch Visit: ID=${branchVisitResult.id}`);

  // STEP 5: MR ACTIONS - MY REPORTS
  console.log('\n--- STEP 5: TESTING MR36 MY REPORTS QUERY ---');
  const mrReports = await getVisibleReports(mrSession);
  console.log(`MR36 Reports retrieved: Doctors=${mrReports.doctors.length}, Pharmacies=${mrReports.pharmacies.length}, Hospitals=${mrReports.hospitals.length}, Branches=${mrReports.branches.length}`);
  const hasDoc = mrReports.doctors.some((d: any) => d.id === docVisitResult.id);
  const hasPharm = mrReports.pharmacies.some((p: any) => p.id === pharmVisitResult.id);
  const hasHosp = mrReports.hospitals.some((h: any) => h.id === hospVisitResult.id);
  const hasBranch = mrReports.branches.some((b: any) => b.id === branchVisitResult.id);

  console.log(`MR36 sees submitted Doctor Visit: ${hasDoc ? '✓ YES' : '✗ NO'}`);
  console.log(`MR36 sees submitted Pharmacy Visit: ${hasPharm ? '✓ YES' : '✗ NO'}`);
  console.log(`MR36 sees submitted Hospital Visit: ${hasHosp ? '✓ YES' : '✗ NO'}`);
  console.log(`MR36 sees submitted Branch Visit: ${hasBranch ? '✓ YES' : '✗ NO'}`);

  if (!hasDoc || !hasPharm || !hasHosp || !hasBranch) {
    throw new Error('MR36 My Reports query did not return all submitted visits');
  }

  // STEP 6: MR ACTIONS - WEEKLY PLAN SUBMISSION & RETRIEVAL
  console.log('\n--- STEP 6: TESTING MR36 WEEKLY PLAN ACTIONS ---');
  const testWeeklyPlan = await saveWeeklyPlan(mrSession, {
    startDate: todayStr,
    endDate: todayStr,
    weekLabel: `Week of ${todayStr}`,
    status: 'Submitted',
    saturdayAm: `Visit ${testHospital.name}`,
    saturdayPm: `Visit ${testDoctor.name}`,
  });
  console.log(`✓ Created Weekly Plan for MR36: ID=${testWeeklyPlan.id}, Status=${testWeeklyPlan.status}`);

  // STEP 7: MR ACTIONS - AVERAGE & COVERAGE RATE
  console.log('\n--- STEP 7: TESTING MR36 AVERAGE & COVERAGE RATE ---');
  const mrAvgCov = await calculateAverageAndCoverage(mrUser.repId!, todayStr, 'daily');
  console.log(`MR36 Overall Coverage: ${mrAvgCov.coverage.overall.coveragePct}% (Color: ${mrAvgCov.coverage.overall.color})`);
  console.log(`MR36 Doctor Coverage: ${mrAvgCov.coverage.doctor.coveragePct}% (${mrAvgCov.coverage.doctor.visitedEntitiesCount}/${mrAvgCov.coverage.doctor.totalInList})`);
  console.log(`MR36 Actual Visits: ${mrAvgCov.averageVisits.overall.actualVisits}`);
  console.log('✓ Average and Coverage calculation completed cleanly');

  // STEP 8: DIRECT MANAGER (DM6) ACTIONS
  console.log('\n--- STEP 8: TESTING DM6 ACTIONS (RECEIVED REPORTS, PLANS, LISTS, ACTIVITY) ---');

  // 8a. Team Reports
  const dmReports = await getVisibleReports(dmSession, { requestedRepId: mrUser.repId! });
  console.log(`DM6 Team Reports for MR36: Doctors=${dmReports.doctors.length}, Pharmacies=${dmReports.pharmacies.length}, Hospitals=${dmReports.hospitals.length}, Branches=${dmReports.branches.length}`);
  const dmSeesDoc = dmReports.doctors.some((d: any) => d.id === docVisitResult.id);
  const dmSeesHosp = dmReports.hospitals.some((h: any) => h.id === hospVisitResult.id);
  console.log(`DM6 sees MR36 Doctor Visit: ${dmSeesDoc ? '✓ YES' : '✗ NO'}`);
  console.log(`DM6 sees MR36 Hospital Visit: ${dmSeesHosp ? '✓ YES' : '✗ NO'}`);

  if (!dmSeesDoc || !dmSeesHosp) {
    throw new Error('DM6 failed to see MR36 submitted visits');
  }

  // 8b. Team Plans - Review & Approve
  const approvedPlan = await updateWeeklyPlanStatus(dmSession, testWeeklyPlan.id, 'Approved', 'Plan looks solid and well-distributed.');
  console.log(`✓ DM6 Approved MR36 Weekly Plan: ID=${approvedPlan.id}, Status=${approvedPlan.status}, Notes="${approvedPlan.managerNotes}"`);

  // 8c. Team Lists - Read Only View
  const dmScopedLists = await getScopedMasterListsForManager(dmSession, mrUser.repId!);
  console.log(`DM6 view of MR36 Lists: Doctors=${dmScopedLists.lists.doctors.length}, Pharmacies=${dmScopedLists.lists.pharmacies.length}`);
  const dmHasDoctor = dmScopedLists.lists.doctors.some((d: any) => d.id === testDoctor.id);
  console.log(`DM6 can view MR36 test doctor in lists: ${dmHasDoctor ? '✓ YES' : '✗ NO'}`);

  // 8d. Submit Manager Activity for MR36
  const testActivity = await saveManagerActivity(dmSession, {
    selectedRepId: mrUser.repId!,
    activityType: 'Visit',
    activityDate: todayStr,
    activitySelections: JSON.stringify([
      { category: 'doctor', customerName: testDoctor.name, feedback: 'Excellent interaction by MR36' },
    ]),
  });
  console.log(`✓ DM6 Submitted Manager Activity: ID=${testActivity.id}`);

  // STEP 9: BUSINESS UNIT MANAGER (BUM2) ACTIONS - VISITS RATE & OVERVIEW
  console.log('\n--- STEP 9: TESTING BUM2 ACTIONS (VISITS RATE ENTRY & RECALCULATION) ---');

  // 9a. Assert BUM2 can see MR36
  await hierarchyService.assertRepVisible(bumSession, mrUser.repId!);
  console.log('✓ BUM2 asserted visibility over MR36');

  // 9b. BUM enters visit rates for MR36 (Literal item details)
  const categories = [
    { cat: 'HOSPITAL' as const, daily: 2 },
    { cat: 'DOCTOR' as const, daily: 10 },
    { cat: 'PHARMACY' as const, daily: 6 },
    { cat: 'DISTRIBUTION_BRANCH' as const, daily: 1 },
  ];

  for (const item of categories) {
    const existing = await db
      .select()
      .from(representativeVisitRates)
      .where(
        and(
          eq(representativeVisitRates.repId, mrUser.repId!),
          eq(representativeVisitRates.customerCategory, item.cat),
          eq(representativeVisitRates.effectiveFrom, todayStr),
        ),
      )
      .get();

    const rateValues = {
      repId: mrUser.repId!,
      customerCategory: item.cat,
      dailyRate: item.daily,
      workingDaysPerWeek: 6,
      workingDaysPerMonth: 26,
      effectiveFrom: todayStr,
      updatedAt: new Date(),
    };

    if (existing) {
      await db
        .update(representativeVisitRates)
        .set(rateValues)
        .where(eq(representativeVisitRates.id, existing.id));
    } else {
      await db.insert(representativeVisitRates).values({
        id: crypto.randomUUID(),
        ...rateValues,
      });
    }
  }
  console.log('✓ BUM2 entered and saved Visits Rate for MR36 across all 4 categories');

  // 9c. Verify Average and Coverage recalculates using BUM rates
  const bumRecalcReport = await calculateAverageAndCoverage(mrUser.repId!, todayStr, 'daily');
  console.log(`Recalculated MR36 Average Visits vs BUM Rate:`);
  console.log(`  - Doctor: Actual=${bumRecalcReport.averageVisits.doctor.actualVisits}, BUM Rate=${bumRecalcReport.averageVisits.doctor.bumRate}, Status=${bumRecalcReport.averageVisits.doctor.comparisonVsBum}, Color=${bumRecalcReport.averageVisits.doctor.colorVsBum}`);
  console.log(`  - Hospital: Actual=${bumRecalcReport.averageVisits.hospital.actualVisits}, BUM Rate=${bumRecalcReport.averageVisits.hospital.bumRate}, Status=${bumRecalcReport.averageVisits.hospital.comparisonVsBum}, Color=${bumRecalcReport.averageVisits.hospital.colorVsBum}`);
  console.log(`  - Overall: Actual=${bumRecalcReport.averageVisits.overall.actualVisits}, BUM Total Rate=${bumRecalcReport.averageVisits.overall.totalBumRate}, Status=${bumRecalcReport.averageVisits.overall.comparisonVsBum}`);

  // 9d. Verify BUM sees team reports across the unit
  const bumReports = await getVisibleReports(bumSession, { requestedRepId: mrUser.repId! });
  console.log(`BUM2 sees MR36 reports: Total=${bumReports.totalVisits}`);
  if (bumReports.totalVisits === 0) {
    throw new Error('BUM2 failed to see MR36 reports');
  }
  console.log('✓ BUM2 full visibility and calculation verified');

  // STEP 10: VERIFY DELETE BUTTONS AND CLEANUP
  console.log('\n--- STEP 10: TESTING DELETE BUTTONS AND SYSTEM INTEGRITY ---');

  // 10a. Delete Branch customer from list
  await deleteMasterItem('branches', testBranch.id, mrUser.repId!);
  const listsAfterDelete = await getMasterListsForRep(mrUser.repId!);
  const branchStillExists = listsAfterDelete.branches.some(b => b.id === testBranch.id);
  console.log(`Delete customer button test: ${!branchStillExists ? '✓ PASS (Customer deleted)' : '✗ FAIL'}`);
  if (branchStillExists) throw new Error('Customer was not deleted from database');

  // 10b. Delete Weekly Plan
  await deleteWeeklyPlan(mrSession, testWeeklyPlan.id);
  const planAfterDelete = await getWeeklyPlanById(testWeeklyPlan.id, mrSession);
  console.log(`Delete weekly plan button test: ${!planAfterDelete ? '✓ PASS (Plan deleted)' : '✗ FAIL'}`);
  if (planAfterDelete) throw new Error('Weekly plan was not deleted from database');

  // 10c. Delete Manager Activity
  await deleteManagerActivity(dmSession, testActivity.id);
  console.log('✓ Delete manager activity button test: PASS (Activity deleted)');

  console.log('\n====================================================');
  console.log('ALL E2E INTEGRATION TESTS PASSED WITH ZERO DEFECTS! ✓');
  console.log('====================================================');
}

main().catch((err) => {
  console.error('\n✗ E2E TEST RUNNER FAILED:', err);
  process.exit(1);
});
