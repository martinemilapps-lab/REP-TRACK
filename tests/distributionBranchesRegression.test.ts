import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalizeMasterListsPayload } from '../src/lib/masterListsPayload';
import { MasterBranchSchema } from '../src/lib/validation';

export function runDistributionBranchesRegressionTests() {
  let passed = 0;
  let failed = 0;
  const test = (name: string, fn: () => void) => {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (error) { failed++; console.error(`  ✗ ${name}`, error); }
  };
  console.log('\n🚚 Distribution Branches regression tests...');
  const view = fs.readFileSync('src/components/my-lists/MyListsView.tsx', 'utf8');
  const route = fs.readFileSync('src/app/api/lists/route.ts', 'utf8');
  const service = fs.readFileSync('src/lib/services/masterListService.ts', 'utf8');

  test('branch navigation and editor have complete field labels', () => {
    assert.match(view, /key: 'branches'/);
    for (const field of ['coverageArea', 'address', 'contact', 'phone', 'distributedProducts']) {
      assert.match(view, new RegExp(`${field}: \\[`));
    }
  });
  test('empty and existing branch lists normalize safely', () => {
    assert.deepEqual(normalizeMasterListsPayload({ hospitals: [], pharmacies: [], doctors: [], branches: [] }).branches, []);
    const branch = { id: 'b1', name: 'Legacy', coverageArea: '', defaultCycle: 7 };
    assert.deepEqual(normalizeMasterListsPayload({ hospitals: [], pharmacies: [], doctors: [], branches: [branch] }).branches, [branch]);
  });
  test('malformed API responses fail safely', () => {
    assert.throws(() => normalizeMasterListsPayload({ hospitals: [], pharmacies: [], doctors: [] }), /branches/);
    assert.match(view, /setLoadError\(true\)/);
  });
  test('legacy nullable optional fields validate without crashing', () => {
    assert.equal(MasterBranchSchema.safeParse({ name: 'Legacy Branch', coverageArea: '' }).success, true);
  });
  test('create, edit, reload, and delete use the authenticated lists route', () => {
    assert.match(view, /method: 'POST'/); assert.match(view, /editingItem\?\.id/);
    assert.match(view, /await loadLists\(selectedRep\)/); assert.match(view, /method: 'DELETE'/);
    assert.match(route, /resolveRepOwnership\(session\)/); assert.match(route, /saveMasterBranch\(validated, ownerRepId\)/);
  });
  test('branch ownership is enforced for edits and deletes', () => {
    assert.match(service, /existing\.repId !== enforcedRepId/);
    assert.match(service, /throw new AppError\([\s\S]*?403\)/);
    assert.match(route, /getScopedMasterListsForManager\(session, repParam\)/);
  });
  test('downstream branch selectors and exports remain wired', () => {
    for (const file of ['src/components/reports/BranchForm.tsx','src/components/weekly-plan/WeeklyPlanView.tsx','src/lib/services/managerActivityService.ts','src/lib/services/exportService.ts']) {
      assert.match(fs.readFileSync(file, 'utf8'), /branches|distributionBranches|Distribution Branches/);
    }
  });
  return { passed, failed };
}
