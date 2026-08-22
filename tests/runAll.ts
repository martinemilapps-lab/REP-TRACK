import { runStatusTests } from './status.test';
import { runCoverageTests } from './coverage.test';
import { runIntegrationTests } from './integration.test';

async function main() {
  console.log('====================================================');
  console.log('🚀 REP TRACK Phase 2: Comprehensive Test Suite');
  console.log('====================================================\n');

  const statusResults = runStatusTests();
  const coverageResults = runCoverageTests();
  const integrationResults = await runIntegrationTests();

  const totalPassed =
    statusResults.passed + coverageResults.passed + integrationResults.passed;
  const totalFailed =
    statusResults.failed + coverageResults.failed + integrationResults.failed;

  console.log('\n====================================================');
  console.log(`📊 Test Summary: ${totalPassed} Passed, ${totalFailed} Failed`);
  console.log('====================================================');

  if (totalFailed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 All Phase 2 tests PASSED successfully!');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
