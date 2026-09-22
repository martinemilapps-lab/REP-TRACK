import { runStatusTests } from './status.test';
import { runCoverageTests } from './coverage.test';
import { runSecurityGatewayTests } from './securityGateway.test';
import { runOrganizationFoundationTests } from './organizationFoundation.test';
import { runPasswordLifecycleTests } from './passwordLifecycle.test';
import { runUnifiedWorkspaceTests } from './unifiedWorkspace.test';
import { runWeeklyPlanEnhancementTests } from './weeklyPlanEnhancement.test';
import { runManagerActivityWorkflowTests } from './managerActivityWorkflow.test';
import { runAvailabilityReportsTests } from './availabilityReports.test';
import { runVisitsFrequencyTests } from './visitsFrequency.test';

// Only suites reviewed as local/pure. Never load dotenv or allow a network fallback.
globalThis.fetch = async () => { throw new Error('Network forbidden in local regression suite'); };

async function main() {
  const results = [
    runStatusTests(), runCoverageTests(), await runSecurityGatewayTests(),
    await runOrganizationFoundationTests(), await runPasswordLifecycleTests(),
    runUnifiedWorkspaceTests(), runWeeklyPlanEnhancementTests(),
    runManagerActivityWorkflowTests(),
    runAvailabilityReportsTests(),
    runVisitsFrequencyTests(),
  ];
  const passed = results.reduce((sum, result) => sum + result.passed, 0);
  const failed = results.reduce((sum, result) => sum + result.failed, 0);
  console.log(`Local existing regressions: ${passed} passed, ${failed} failed.`);
  if (failed) process.exitCode = 1;
}

main().catch(error => { console.error(error); process.exitCode = 1; });
