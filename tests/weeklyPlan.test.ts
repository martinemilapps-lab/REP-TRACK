import {
  WeeklyPlanSchema,
  DoctorVisitSchema,
  HospitalVisitSchema,
  PharmacyVisitSchema,
  BranchVisitSchema,
} from '../src/lib/validation';
import {
  saveWeeklyPlan,
  getWeeklyPlans,
  getWeeklyPlanById,
  updateWeeklyPlanStatus,
  deleteWeeklyPlan,
} from '../src/lib/services/weeklyPlanService';
import { generateWeeklyPlanWorkbook } from '../src/lib/excel';
import { db, representatives } from '../src/lib/db';
import { eq } from 'drizzle-orm';

export async function runWeeklyPlanTests() {
  console.log('\n🧪 Running Single/Double Visits & Weekly Plan Test Suite...');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✓ ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // ----------------------------------------------------
    // 1. Visit Nature Schema Validation (Single vs Double)
    // ----------------------------------------------------
    const validSingleDoc = DoctorVisitSchema.safeParse({
      rep: 'مارتن إميل بولس',
      name: 'د. أحمد سامي',
      specialty: 'Orthopedics',
      visitType: 'Single',
      notes: 'Routine visit',
    });
    assert(validSingleDoc.success === true, 'Doctor visit with Single type is valid');

    const validDoubleDoc = DoctorVisitSchema.safeParse({
      rep: 'مارتن إميل بولس',
      name: 'د. أحمد سامي',
      visitType: 'Double',
      companion: 'د. فوزي ناصر (Line Manager)',
    });
    assert(validDoubleDoc.success === true, 'Doctor visit with Double type and companion is valid');

    const validSingleHosp = HospitalVisitSchema.safeParse({
      rep: 'مارتن إميل بولس',
      name: 'مستشفى السلام الدولي',
      visitType: 'Single',
    });
    assert(validSingleHosp.success === true, 'Hospital visit with Single type is valid');

    const validDoublePharm = PharmacyVisitSchema.safeParse({
      rep: 'مارتن إميل بولس',
      name: 'صيدلية العزبي - المهندسين',
      visitType: 'Double',
      companion: 'سارة عادل',
    });
    assert(validDoublePharm.success === true, 'Pharmacy visit with Double type and companion is valid');

    const validSingleBranch = BranchVisitSchema.safeParse({
      rep: 'مارتن إميل بولس',
      name: 'الشركة المصرية لتوزيع الأدوية',
      visitType: 'Single',
    });
    assert(validSingleBranch.success === true, 'Branch visit with Single type is valid');

    // ----------------------------------------------------
    // 2. Weekly Plan Schema Validation
    // ----------------------------------------------------
    const validPlan = WeeklyPlanSchema.safeParse({
      rep: 'مارتن إميل بولس',
      startDate: '2026-08-22',
      endDate: '2026-08-28',
      weekLabel: '22-8-2026 to 28-8-2026',
      saturdayAm: 'Line 1 meeting then office working',
      saturdayPm: 'Office working',
      sundayAm: 'Line 2 meeting then Am double visit with sara Adel',
      sundayPm: 'Pm double visit with sara Adel',
      mondayAm: 'Line 3 meeting then Am single visits in Mohandseen',
      mondayPm: 'Pm single visits in Mohandsen',
      tuesdayAm: 'Line 1 meeting then Am double visit with fawzy nasser',
      tuesdayPm: 'Pm double visit with fawzy nasser',
      wednesdayAm: 'Line 2 meeting then office working',
      wednesdayPm: 'Office working',
      thursdayAm: 'Line 3 meeting then office working',
      thursdayPm: 'Office working',
      fridayAm: 'Field visits / Follow-up',
      fridayPm: 'Off / Weekly summary',
    });
    assert(validPlan.success === true, 'Valid weekly plan successfully parsed by WeeklyPlanSchema');

    const invalidPlan = WeeklyPlanSchema.safeParse({
      // missing rep and dates
      saturdayAm: 'Meeting',
    });
    assert(invalidPlan.success === false, 'Invalid weekly plan without rep/dates correctly rejected');

    // ----------------------------------------------------
    // 3. Weekly Plan Service Database Operations (CRUD)
    // ----------------------------------------------------
    const rep = await db.select().from(representatives).get();
    if (!rep) {
      console.warn('  ⚠️ No representative found in DB for service test');
    } else {
      const managerSession = {
        id: 'test-manager-id',
        username: 'manager',
        name: 'General Manager',
        role: 'MANAGER' as const,
        repId: null,
      };

      // 3.1 Save / Create
      const saved = await saveWeeklyPlan(null, {
        rep: rep.name,
        repId: rep.id,
        startDate: '2026-08-22',
        endDate: '2026-08-28',
        weekLabel: '22-8-2026 to 28-8-2026',
        saturdayAm: 'Line 1 meeting then office working',
        saturdayPm: 'Office working',
        sundayAm: 'Line 2 meeting then Am double visit with sara Adel',
        sundayPm: 'Pm double visit with sara Adel',
        mondayAm: 'Line 3 meeting then Am single visits in Mohandseen',
        mondayPm: 'Pm single visits in Mohandsen',
        tuesdayAm: 'Line 1 meeting then Am double visit with fawzy nasser',
        tuesdayPm: 'Pm double visit with fawzy nasser',
        wednesdayAm: 'Line 2 meeting then office working',
        wednesdayPm: 'Office working',
        thursdayAm: 'Line 3 meeting then office working',
        thursdayPm: 'Office working',
        fridayAm: 'Field visits',
        fridayPm: 'Off',
      });
      assert(!!saved && !!saved.id, 'Weekly plan saved successfully in database');

      // 3.2 Query List
      const plansList = await getWeeklyPlans(null, { repId: rep.id });
      assert(plansList.length > 0, 'getWeeklyPlans returns list containing saved plan');

      // 3.3 Query By ID
      const fetched = await getWeeklyPlanById(saved.id);
      assert(
        !!fetched && fetched.saturdayAm === 'Line 1 meeting then office working',
        'getWeeklyPlanById retrieves matching plan details'
      );

      // 3.4 Update Status to Approved with Manager Notes
      const updated = await updateWeeklyPlanStatus(
        managerSession,
        saved.id,
        'Approved',
        'خطة ممتازة ومعتمدة، بالتوفيق.'
      );
      assert(
        !!updated && updated.status === 'Approved' && !!updated.managerNotes?.includes('ممتازة'),
        'Weekly plan status updated to Approved with manager notes'
      );

      // ----------------------------------------------------
      // 4. Excel Template Generator Test
      // ----------------------------------------------------
      const excelBuffer = generateWeeklyPlanWorkbook(updated);
      assert(
        (excelBuffer instanceof Uint8Array || Buffer.isBuffer(excelBuffer)) && excelBuffer.length > 1000,
        'generateWeeklyPlanWorkbook generates valid binary .xlsx buffer'
      );

      // 3.5 Cleanup / Delete
      const deleted = await deleteWeeklyPlan(managerSession, saved.id);
      assert(deleted === true, 'Weekly plan deleted successfully');
    }
  } catch (err) {
    console.error('Error running weekly plan tests:', err);
    failed++;
  }

  return { passed, failed };
}
