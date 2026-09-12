const runRemoteIntegration = process.argv.includes('--remote-integration') && process.env.REP_TRACK_REMOTE_TEST_TARGET === 'NON_PRODUCTION';
if (process.argv.includes('--remote-integration') && !runRemoteIntegration) {
  throw new Error('Remote integration tests require REP_TRACK_REMOTE_TEST_TARGET=NON_PRODUCTION. Production is never an automated-test target.');
}

import { runStatusTests } from './status.test';
import { runCoverageTests } from './coverage.test';
import { runIntegrationTests } from './integration.test';
import { runWeeklyPlanTests } from './weeklyPlan.test';
import { runMyListsTests } from './myLists.test';
import { runSecurityGatewayTests } from './securityGateway.test';
import { runOrganizationFoundationTests } from './organizationFoundation.test';
import { runPasswordLifecycleTests } from './passwordLifecycle.test';
import { runUnifiedWorkspaceTests } from './unifiedWorkspace.test';
import { runMrListsOwnershipTests } from './mrListsOwnership.test';
import { runTask1Tests } from './task1.test';

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

  console.log('📋 Running MR Lists Ownership & Autosave Tests (STEP 18)...');
  const mrListsResults = runRemoteIntegration ? await runMrListsOwnershipTests() : { passed: 0, failed: 0, checks: [] };
  for (const check of mrListsResults.checks) {
    if (check.startsWith('✓ PASS:')) {
      console.log(`  ✓ ${check.replace('✓ PASS: ', '')}`);
    } else {
      console.error(`  ✗ ${check.replace('✗ FAIL: ', '')}`);
    }
  }
  console.log(`  📊 MR Lists Test Summary: ${mrListsResults.passed} Passed, ${mrListsResults.failed} Failed\n`);

  const statusResults = runStatusTests();
  const coverageResults = runCoverageTests();
  const integrationResults = runRemoteIntegration ? await runIntegrationTests() : { passed: 0, failed: 0 };
  const weeklyPlanResults = runRemoteIntegration ? await runWeeklyPlanTests() : { passed: 0, failed: 0 };
  const myListsResults = runRemoteIntegration ? await runMyListsTests() : { passed: 0, failed: 0 };
  const task1Results = runTask1Tests();

  if (!runRemoteIntegration) {
    console.log('🛡️ Remote database integration suites skipped. Use an explicitly designated NON_PRODUCTION target to run them.');
  }

  const totalPassed =
    securityResults.passed +
    orgResults.passed +
    passwordResults.passed +
    workspaceResults.passed +
    mrListsResults.passed +
    statusResults.passed +
    coverageResults.passed +
    integrationResults.passed +
    weeklyPlanResults.passed +
    myListsResults.passed +
    task1Results.passed;
  const totalFailed =
    securityResults.failed +
    orgResults.failed +
    passwordResults.failed +
    workspaceResults.failed +
    mrListsResults.failed +
    statusResults.failed +
    coverageResults.failed +
    integrationResults.failed +
    weeklyPlanResults.failed +
    myListsResults.failed +
    task1Results.failed;

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
