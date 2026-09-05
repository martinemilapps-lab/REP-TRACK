import { runVerification } from '../scripts/verify_step15b';

export async function runOrganizationFoundationTests(): Promise<{ passed: number; failed: number }> {
  console.log('\n🏛️ Running Organization Foundation & Dual-Role Sales Tests (STEP 15B)...');

  const results = runVerification();

  for (const check of results.checks) {
    if (check.startsWith('✓ PASS:')) {
      console.log(`  ✓ ${check.replace('✓ PASS: ', '')}`);
    } else {
      console.error(`  ✗ ${check.replace('✗ FAIL: ', '')}`);
    }
  }

  console.log(`  📊 Organization Test Summary: ${results.passed} Passed, ${results.failed} Failed\n`);
  return { passed: results.passed, failed: results.failed };
}
