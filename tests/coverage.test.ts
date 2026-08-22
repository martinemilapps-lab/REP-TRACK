import { calculateCoverage } from '../src/lib/business/coverage';

export function runCoverageTests() {
  console.log('\n🧪 Running Coverage Engine Tests...');
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

  // 1. Zero targets (assigned = 0 returns 0%)
  const res1 = calculateCoverage(
    {
      repId: 'rep_1',
      repName: 'Test Rep',
      area: 'Cairo',
      assignedHospitals: 0,
      assignedPharmacies: 0,
      assignedDrs: 0,
    },
    { hospitals: 5, pharmacies: 10, doctors: 15 }
  );
  assert(res1.hospitalCoveragePct === 0, 'Zero assigned hospitals returns 0%');
  assert(res1.pharmacyCoveragePct === 0, 'Zero assigned pharmacies returns 0%');
  assert(res1.drCoveragePct === 0, 'Zero assigned doctors returns 0%');
  assert(res1.overallCoveragePct === 0, 'Zero assigned targets returns 0% overall');

  // 2. Exact targets (actual = assigned returns 100%)
  const res2 = calculateCoverage(
    {
      repId: 'rep_2',
      repName: 'Test Rep 2',
      area: 'Giza',
      assignedHospitals: 10,
      assignedPharmacies: 20,
      assignedDrs: 50,
    },
    { hospitals: 10, pharmacies: 20, doctors: 50 }
  );
  assert(res2.hospitalCoveragePct === 100, 'Exact target hospitals returns 100%');
  assert(res2.pharmacyCoveragePct === 100, 'Exact target pharmacies returns 100%');
  assert(res2.drCoveragePct === 100, 'Exact target doctors returns 100%');
  assert(res2.overallCoveragePct === 100, 'Exact target returns 100% overall');

  // 3. Below target (e.g. 5/10 hospitals = 50%, 10/20 pharmacies = 50%, 25/50 doctors = 50%)
  const res3 = calculateCoverage(
    {
      repId: 'rep_3',
      repName: 'Test Rep 3',
      area: 'Alexandria',
      assignedHospitals: 10,
      assignedPharmacies: 20,
      assignedDrs: 50,
    },
    { hospitals: 5, pharmacies: 10, doctors: 25 }
  );
  assert(res3.hospitalCoveragePct === 50, 'Half target hospitals returns 50%');
  assert(res3.overallCoveragePct === 50, 'Balanced 50% coverage returns 50% overall');

  // 4. Above target (actual > assigned, e.g. 15/10 = 150%, capped at 100%)
  const res4 = calculateCoverage(
    {
      repId: 'rep_4',
      repName: 'Test Rep 4',
      area: 'Mansoura',
      assignedHospitals: 10,
      assignedPharmacies: 10,
      assignedDrs: 10,
    },
    { hospitals: 15, pharmacies: 10, doctors: 10 }
  );
  assert(res4.hospitalCoveragePct === 100, '15/10 actual capped at 100%');
  assert(res4.overallCoveragePct === 100, 'Overall coverage is 100%');

  // 5. Mixed coverage with rounding:
  // Hosp: 1/3 = 33%, Pharm: 2/3 = 67%, Dr: 3/3 = 100%
  // Average = (33 + 67 + 100) / 3 = 200 / 3 = 67%
  const res5 = calculateCoverage(
    {
      repId: 'rep_5',
      repName: 'Test Rep 5',
      area: 'Tanta',
      assignedHospitals: 3,
      assignedPharmacies: 3,
      assignedDrs: 3,
    },
    { hospitals: 1, pharmacies: 2, doctors: 3 }
  );
  assert(res5.hospitalCoveragePct === 33, '1/3 rounds to 33%');
  assert(res5.pharmacyCoveragePct === 67, '2/3 rounds to 67%');
  assert(res5.drCoveragePct === 100, '3/3 is 100%');
  assert(res5.overallCoveragePct === 67, 'Overall average rounds to 67%');

  return { passed, failed };
}
