import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { runStatusTests } from './status.test';
import { runCoverageTests } from './coverage.test';
import { runIntegrationTests } from './integration.test';
import { runWeeklyPlanTests } from './weeklyPlan.test';
import { runMyListsTests } from './myLists.test';
import { runSecurityGatewayTests } from './securityGateway.test';
import { runOrganizationFoundationTests } from './organizationFoundation.test';
import { runPasswordLifecycleTests } from './passwordLifecycle.test';
import { runUnifiedWorkspaceTests } from './unifiedWorkspace.test';

async function main() {
  console.log('====================================================');
  console.log('🚀 REP TRACK: Comprehensive Test Suite');
  console.log('====================================================\n');

  const securityResults = await runSecurityGatewayTests();
  const orgResults = await runOrganizationFoundationTests();

  console.log('\n🔐 Running Password Lifecycle & Security Tests (STEP 16)...');
  const passwordResults = await runPasswordLifecycleTests();
  for (const check of passwordResults.checks) {
    if (check.startsWith('✓ PASS:')) {
      console.log(`  ✓ ${check.replace('✓ PASS: ', '')}`);
    } else {
      console.error(`  ✗ ${check.replace('✗ FAIL: ', '')}`);
    }
  }
  console.log(`  📊 Password Test Summary: ${passwordResults.passed} Passed, ${passwordResults.failed} Failed\n`);

  console.log('🏢 Running Unified Authentication Entry & Workspace Tests (STEP 17)...');
  const workspaceResults = runUnifiedWorkspaceTests();
  for (const check of workspaceResults.checks) {
    if (check.startsWith('✓ PASS:')) {
      console.log(`  ✓ ${check.replace('✓ PASS: ', '')}`);
    } else {
      console.error(`  ✗ ${check.replace('✗ FAIL: ', '')}`);
    }
  }
  console.log(`  📊 Workspace Test Summary: ${workspaceResults.passed} Passed, ${workspaceResults.failed} Failed\n`);

  const statusResults = runStatusTests();
  const coverageResults = runCoverageTests();
  const integrationResults = await runIntegrationTests();
  const weeklyPlanResults = await runWeeklyPlanTests();
  const myListsResults = await runMyListsTests();

  const totalPassed =
    securityResults.passed +
    orgResults.passed +
    passwordResults.passed +
    workspaceResults.passed +
    statusResults.passed +
    coverageResults.passed +
    integrationResults.passed +
    weeklyPlanResults.passed +
    myListsResults.passed;
  const totalFailed =
    securityResults.failed +
    orgResults.failed +
    passwordResults.failed +
    workspaceResults.failed +
    statusResults.failed +
    coverageResults.failed +
    integrationResults.failed +
    weeklyPlanResults.failed +
    myListsResults.failed;

  console.log('\n====================================================');
  console.log(`📊 Test Summary: ${totalPassed} Passed, ${totalFailed} Failed`);
  console.log('====================================================');

  if (totalFailed > 0) {
    process.exitCode = 1;
  } else {
    console.log('🎉 All tests PASSED successfully!');
    process.exitCode = 0;
  }
}

main().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
