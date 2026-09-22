import {
  calculateExpectedVisits,
  getFrequencyComparison,
  FrequencyColor,
} from '../src/lib/services/averageCoverageService';

export function runVisitsFrequencyTests() {
  console.log('\n🔄 Running Visits Frequency Engine Tests...');
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

  // 1. Daily expected visits
  assert(calculateExpectedVisits(7, 1, 'daily') === 1, 'Daily period returns 1 visit target for 7-day cycle');
  assert(calculateExpectedVisits(14, 1, 'daily') === 1, 'Daily period returns 1 visit target for 14-day cycle');
  assert(calculateExpectedVisits(30, 1, 'daily') === 1, 'Daily period returns 1 visit target for 30-day cycle');

  // 2. Weekly expected visits (7 days)
  assert(calculateExpectedVisits(7, 7, 'weekly') === 1, 'Weekly period returns 1 visit for 7-day cycle');
  assert(calculateExpectedVisits(14, 7, 'weekly') === 1, 'Weekly period returns 1 visit minimum for 14-day cycle');

  // 3. Monthly expected visits (30 days)
  assert(calculateExpectedVisits(7, 30, 'monthly') === 4, 'Monthly period returns 4 visits for 7-day cycle (30/7 ~ 4)');
  assert(calculateExpectedVisits(10, 30, 'monthly') === 3, 'Monthly period returns 3 visits for 10-day cycle (30/10 = 3)');
  assert(calculateExpectedVisits(14, 30, 'monthly') === 2, 'Monthly period returns 2 visits for 14-day cycle (30/14 ~ 2)');
  assert(calculateExpectedVisits(21, 30, 'monthly') === 1, 'Monthly period returns 1 visit for 21-day cycle (30/21 ~ 1)');
  assert(calculateExpectedVisits(30, 30, 'monthly') === 1, 'Monthly period returns 1 visit for 30-day cycle (30/30 = 1)');
  assert(calculateExpectedVisits(null, 30, 'monthly') === 4, 'Default 7-day cycle fallback returns 4 visits for monthly');

  // 4. Color Assignment Rules:
  // Rule: Same frequency = Green
  const sameComp = getFrequencyComparison(4, 4);
  assert(sameComp.color === 'GREEN' && sameComp.status === 'SAME', 'Actual === Expected yields GREEN (Same frequency)');

  const zeroSame = getFrequencyComparison(0, 0);
  assert(zeroSame.color === 'GREEN' && zeroSame.status === 'SAME', '0 === 0 yields GREEN');

  // Rule: Overvisited = Red
  const overComp = getFrequencyComparison(5, 4);
  assert(overComp.color === 'RED' && overComp.status === 'OVER', 'Actual > Expected yields RED (Overvisited)');

  const overComp2 = getFrequencyComparison(2, 1);
  assert(overComp2.color === 'RED' && overComp2.status === 'OVER', '2 > 1 yields RED (Overvisited)');

  // Rule: Less visited = Yellow
  const lessComp = getFrequencyComparison(2, 4);
  assert(lessComp.color === 'YELLOW' && lessComp.status === 'LESS', 'Actual < Expected yields YELLOW (Less visited)');

  const zeroLess = getFrequencyComparison(0, 4);
  assert(zeroLess.color === 'YELLOW' && zeroLess.status === 'LESS', '0 visits with 4 expected yields YELLOW (Less visited)');

  const oneLess = getFrequencyComparison(1, 2);
  assert(oneLess.color === 'YELLOW' && oneLess.status === 'LESS', '1 visit with 2 expected yields YELLOW (Less visited)');

  return { passed, failed };
}
