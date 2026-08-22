import { deriveVisitStatus } from '../src/lib/business/status';

export function runStatusTests() {
  console.log('🧪 Running Status Engine Tests...');
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

  // Reference date: 2026-08-22
  const refDate = '2026-08-22';

  // 1. Not visited yet (missing lastVisitDate)
  const res1 = deriveVisitStatus({ lastVisitDate: null, referenceDate: refDate });
  assert(res1 === 'Not visited yet', 'Missing last visit date returns "Not visited yet"');

  const res2 = deriveVisitStatus({ lastVisitDate: '', referenceDate: refDate });
  assert(res2 === 'Not visited yet', 'Empty last visit date returns "Not visited yet"');

  // 2. Visit today
  const res3 = deriveVisitStatus({ lastVisitDate: '2026-08-22', cycleDays: 7, referenceDate: refDate });
  assert(res3 === 'Visited', 'Visit today with 7-day cycle returns "Visited"');

  // 3. Visit yesterday within cycle
  const res4 = deriveVisitStatus({ lastVisitDate: '2026-08-21', cycleDays: 7, referenceDate: refDate });
  assert(res4 === 'Visited', 'Visit yesterday with 7-day cycle returns "Visited"');

  // 4. Overdue by cycle expiration (visited 10 days ago with 7-day cycle)
  const res5 = deriveVisitStatus({ lastVisitDate: '2026-08-12', cycleDays: 7, referenceDate: refDate });
  assert(res5 === 'Overdue', 'Visit 10 days ago with 7-day cycle returns "Overdue"');

  // 5. Future next visit date
  const res6 = deriveVisitStatus({
    lastVisitDate: '2026-08-20',
    nextVisitDate: '2026-08-25',
    cycleDays: 14,
    referenceDate: refDate,
  });
  assert(res6 === 'Visited', 'Future next visit date returns "Visited"');

  // 6. Overdue next visit date (next visit was yesterday)
  const res7 = deriveVisitStatus({
    lastVisitDate: '2026-08-15',
    nextVisitDate: '2026-08-21',
    cycleDays: 14,
    referenceDate: refDate,
  });
  assert(res7 === 'Overdue', 'Past next visit date returns "Overdue"');

  // 7. Cycle = 0 with future next visit
  const res8 = deriveVisitStatus({
    lastVisitDate: '2026-08-20',
    nextVisitDate: '2026-08-24',
    cycleDays: 0,
    referenceDate: refDate,
  });
  assert(res8 === 'Visited', 'Cycle = 0 with future next visit returns "Visited"');

  // 8. Boundary: next visit is today
  const res9 = deriveVisitStatus({
    lastVisitDate: '2026-08-15',
    nextVisitDate: '2026-08-22',
    cycleDays: 7,
    referenceDate: refDate,
  });
  assert(res9 === 'Visited', 'Next visit is today (boundary) returns "Visited"');

  // 9. Boundary: lastVisit + cycle = today
  const res10 = deriveVisitStatus({
    lastVisitDate: '2026-08-15',
    cycleDays: 7,
    referenceDate: refDate,
  });
  assert(res10 === 'Visited', 'Last visit + cycle = today (boundary) returns "Visited"');

  return { passed, failed };
}
