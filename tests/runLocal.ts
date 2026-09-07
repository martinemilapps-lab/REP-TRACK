import { runStatusTests } from './status.test';
import { runCoverageTests } from './coverage.test';
import { runSecurityGatewayTests } from './securityGateway.test';
import { runOrganizationFoundationTests } from './organizationFoundation.test';
import { runPasswordLifecycleTests } from './passwordLifecycle.test';
import { runUnifiedWorkspaceTests } from './unifiedWorkspace.test';

// Only suites reviewed as local/pure. Never load dotenv or allow a network fallback.
globalThis.fetch = async () => { throw new Error('Network forbidden in local regression suite'); };

async function main() {
  const results = [
    runStatusTests(), runCoverageTests(), await runSecurityGatewayTests(),
    await runOrganizationFoundationTests(), await runPasswordLifecycleTests(),
    runUnifiedWorkspaceTests(),
  ];
  const passed = results.reduce((sum, result) => sum + result.passed, 0);
  const failed = results.reduce((sum, result) => sum + result.failed, 0);
  console.log(`Local existing regressions: ${passed} passed, ${failed} failed.`);
  if (failed) process.exitCode = 1;
}

main().catch(error => { console.error(error); process.exitCode = 1; });
