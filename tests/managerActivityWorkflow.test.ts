import assert from 'node:assert';
import fs from 'node:fs';
import { ManagerActivitySchema } from '../src/lib/validation';

export function runManagerActivityWorkflowTests(): { passed: number; failed: number } {
  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void) {
    try {
      fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}`);
      console.error(err);
      failed++;
    }
  }

  console.log('\n🧪 Running Manager Activity Workflow & Visit Type Tests...');

  // 1. Visit Type tests on ManagerActivitySchema
  test('Manager Activity defaults to visitType Single and empty accompaniedPerson', () => {
    const parsed = ManagerActivitySchema.parse({
      reportContextType: 'EMPLOYEE',
      selectedRepId: 'rep-test-1',
      activityType: 'Visit',
      activityDate: '2026-09-22',
      visits: [],
    });
    assert.strictEqual(parsed.visitType, 'Single');
    assert.strictEqual(parsed.accompaniedPerson, '');
  });

  test('Manager Activity with Double visit type and no accompaniedPerson is rejected', () => {
    assert.throws(
      () => {
        ManagerActivitySchema.parse({
          reportContextType: 'EMPLOYEE',
          selectedRepId: 'rep-test-1',
          activityType: 'Visit',
          activityDate: '2026-09-22',
          visitType: 'Double',
          accompaniedPerson: '',
          visits: [],
        });
      },
      (err: any) => {
        assert.match(err.message, /اسم الشخص المرافق مطلوب/);
        return true;
      }
    );
  });

  test('Manager Activity with Double visit type and valid accompaniedPerson is accepted', () => {
    const parsed = ManagerActivitySchema.parse({
      reportContextType: 'EMPLOYEE',
      selectedRepId: 'rep-test-1',
      activityType: 'Visit',
      activityDate: '2026-09-22',
      visitType: 'Double',
      accompaniedPerson: 'Randa Magdy',
      visits: [],
    });
    assert.strictEqual(parsed.visitType, 'Double');
    assert.strictEqual(parsed.accompaniedPerson, 'Randa Magdy');
  });

  test('Manager Activity with VACANT reportContextType and Single visit type is accepted', () => {
    const parsed = ManagerActivitySchema.parse({
      reportContextType: 'VACANT',
      selectedRepId: null,
      activityType: 'Visit',
      activityDate: '2026-09-22',
      visitType: 'Single',
      visits: [],
    });
    assert.strictEqual(parsed.reportContextType, 'VACANT');
    assert.strictEqual(parsed.selectedRepId, null);
    assert.strictEqual(parsed.visitType, 'Single');
  });

  // 2. Component inspection tests
  test('ManagerActivityForm includes /api/lists?rep= query for dynamic MR My Lists integration', () => {
    const code = fs.readFileSync('src/components/manager/ManagerActivityForm.tsx', 'utf8');
    assert.match(code, /\/api\/lists\?rep=/);
    assert.match(code, /mrLists/);
    assert.match(code, /mrLists\.hospitals/);
    assert.match(code, /mrLists\.doctors/);
    assert.match(code, /mrLists\.pharmacies/);
    assert.match(code, /mrLists\.branches/);
  });

  test('ManagerActivityForm implements Visit Type Switch with Vacant deactivation and Single default', () => {
    const code = fs.readFileSync('src/components/manager/ManagerActivityForm.tsx', 'utf8');
    assert.match(code, /setVisitType\('Single'\)/);
    assert.match(code, /setVisitType\('Double'\)/);
    assert.match(code, /isSwitchDeactivated/);
    assert.match(code, /Deactivated for Vacant/);
    assert.match(code, /Select MR first/);
  });

  return { passed, failed };
}

if (process.argv[1]?.includes('managerActivityWorkflow.test')) {
  const result = runManagerActivityWorkflowTests();
  process.exit(result.failed > 0 ? 1 : 0);
}
