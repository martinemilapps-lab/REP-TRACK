import { runStatusTests } from './status.test';
import { runCoverageTests } from './coverage.test';
import { runIntegrationTests } from './integration.test';
import { runWeeklyPlanTests } from './weeklyPlan.test';

async function main() {
  console.log('====================================================');
  console.log('🚀 REP TRACK: Comprehensive Test Suite');
  console.log('====================================================\n');

  const statusResults = runStatusTests();
  const coverageResults = runCoverageTests();
  const integrationResults = await runIntegrationTests();
  const weeklyPlanResults = await runWeeklyPlanTests();

  const totalPassed =
    statusResults.passed +
    coverageResults.passed +
    integrationResults.passed +
    weeklyPlanResults.passed;
  const totalFailed =
    statusResults.failed +
    coverageResults.failed +
    integrationResults.failed +
    weeklyPlanResults.failed;

  console.log('\n====================================================');
  console.log(`📊 Test Summary: ${totalPassed} Passed, ${totalFailed} Failed`);
  console.log('====================================================');

  if (totalFailed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 All tests PASSED successfully!');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
