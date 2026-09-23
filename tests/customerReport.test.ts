import {
  calculateExpectedVisits,
  getFrequencyComparison,
  getCoverageColor,
  CustomerReportItem,
} from '../src/lib/services/averageCoverageService';

export function runCustomerReportTests() {
  console.log('\n📊 Running Customer Report (Average, Coverage & Frequency) Tests...');
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

  // 1. Customer Coverage Percentage Logic Tests
  function calcCustomerCoverage(actual: number, expected: number) {
    const isCovered = actual > 0;
    const coveragePct = expected > 0
      ? Math.min(100, Math.round((actual / expected) * 100))
      : (isCovered ? 100 : 0);
    const coverageColor = getCoverageColor(coveragePct);
    const coverageStatus = coveragePct >= 100 ? 'FULL' : (coveragePct > 0 ? 'PARTIAL' : 'UNCOVERED');
    return { coveragePct, coverageColor, coverageStatus, isCovered };
  }

  const cov0 = calcCustomerCoverage(0, 4);
  assert(cov0.coveragePct === 0, '0 visits yields 0% coverage');
  assert(cov0.isCovered === false, '0 visits marks customer as not covered');
  assert(cov0.coverageColor === 'RED', '0% coverage yields RED badge');
  assert(cov0.coverageStatus === 'UNCOVERED', '0% coverage status is UNCOVERED');

  const covHalf = calcCustomerCoverage(2, 4);
  assert(covHalf.coveragePct === 50, '2/4 visits yields 50% coverage');
  assert(covHalf.isCovered === true, '2/4 visits marks customer as covered');
  assert(covHalf.coverageColor === 'RED', '50% coverage yields RED badge (<80%)');
  assert(covHalf.coverageStatus === 'PARTIAL', '50% coverage status is PARTIAL');

  const covMid = calcCustomerCoverage(4, 5);
  assert(covMid.coveragePct === 80, '4/5 visits yields 80% coverage');
  assert(covMid.coverageColor === 'YELLOW', '80% coverage yields YELLOW badge (80-89.9%)');
  assert(covMid.coverageStatus === 'PARTIAL', '80% coverage status is PARTIAL');

  const covHigh = calcCustomerCoverage(4, 4);
  assert(covHigh.coveragePct === 100, '4/4 visits yields 100% coverage');
  assert(covHigh.coverageColor === 'GREEN', '100% coverage yields GREEN badge (>=90%)');
  assert(covHigh.coverageStatus === 'FULL', '100% coverage status is FULL');

  const covOver = calcCustomerCoverage(6, 4);
  assert(covOver.coveragePct === 100, '6/4 visits caps at 100% coverage');
  assert(covOver.coverageColor === 'GREEN', '6/4 visits yields GREEN badge');
  assert(covOver.coverageStatus === 'FULL', '6/4 visits status is FULL');

  // 2. Frequency Comparison Rules
  // GREEN: actual === expected
  const freqSame = getFrequencyComparison(4, 4);
  assert(freqSame.color === 'GREEN' && freqSame.status === 'SAME', 'Actual === Expected yields GREEN (Same Frequency)');

  // RED: actual > expected (Overvisited)
  const freqOver = getFrequencyComparison(5, 4);
  assert(freqOver.color === 'RED' && freqOver.status === 'OVER', 'Actual > Expected yields RED (Overvisited)');

  // YELLOW: actual < expected (Less visited)
  const freqLess = getFrequencyComparison(2, 4);
  assert(freqLess.color === 'YELLOW' && freqLess.status === 'LESS', 'Actual < Expected yields YELLOW (Less Visited)');

  // 3. Expected visits based on cycle days in My Lists
  assert(calculateExpectedVisits(7, 30, 'monthly') === 4, '7-day cycle in 30 days requires 4 visits');
  assert(calculateExpectedVisits(14, 30, 'monthly') === 2, '14-day cycle in 30 days requires 2 visits');
  assert(calculateExpectedVisits(30, 30, 'monthly') === 1, '30-day cycle in 30 days requires 1 visit');
  assert(calculateExpectedVisits(7, 7, 'weekly') === 1, '7-day cycle in 7 days requires 1 visit');
  assert(calculateExpectedVisits(7, 1, 'daily') === 1, 'Daily period always requires 1 visit minimum');

  return { passed, failed };
}

if (require.main === module) {
  const result = runCustomerReportTests();
  console.log(`\nCustomer Report Tests: ${result.passed} passed, ${result.failed} failed`);
  if (result.failed > 0) process.exit(1);
}
