import assert from 'node:assert/strict';
import { resolveHierarchyAncestorIds, resolveHierarchyUserIds, type HierarchyEdge } from '../src/lib/services/hierarchyService';
import { assertAuthenticatedSession } from '../src/lib/authPolicy';

const active = new Set(['mr1','mr2','dm','am','om','bum1','bum2','pm','mm','smd']);
const edges: HierarchyEdge[] = [
  { subordinateUserId:'mr1', managerUserId:'dm' }, { subordinateUserId:'dm', managerUserId:'am' },
  { subordinateUserId:'am', managerUserId:'bum1' }, { subordinateUserId:'bum1', managerUserId:'smd' },
  { subordinateUserId:'mr2', managerUserId:'am' }, { subordinateUserId:'mr2', managerUserId:'om' },
  { subordinateUserId:'om', managerUserId:'bum1' }, { subordinateUserId:'mr2', managerUserId:'bum1' },
  { subordinateUserId:'pm', managerUserId:'mm' }, { subordinateUserId:'mm', managerUserId:'smd' },
  { subordinateUserId:'am', managerUserId:'bum2' }, { subordinateUserId:'bum2', managerUserId:'smd' },
  { subordinateUserId:'mr1', managerUserId:'dm' },
  { subordinateUserId:'inactive', managerUserId:'am' },
];
const all = resolveHierarchyUserIds('smd', edges, active, 'ALL_DESCENDANTS');
assert.deepEqual(new Set(all), new Set(['bum1','bum2','am','om','dm','mr1','mr2','mm','pm']));
assert.deepEqual(new Set(resolveHierarchyUserIds('am', edges, active, 'DIRECT_REPORTS')), new Set(['dm','mr2']));
assert.deepEqual(new Set(resolveHierarchyUserIds('am', edges, active, 'ALL_DESCENDANTS')), new Set(['dm','mr1','mr2']));
assert.equal(all.length, new Set(all).size, 'multi-path and duplicate edges must deduplicate');
assert(!all.includes('inactive'), 'inactive users are excluded');
assert(!all.includes('vacant'), 'vacancies have no user identity');
assert(resolveHierarchyAncestorIds('mr2', edges, active).includes('smd'), 'skipped and multiple paths reach SMD');
assert(!resolveHierarchyUserIds('om', edges, active, 'ALL_DESCENDANTS').includes('mr1'), 'unrelated manager cannot view team');
assert.doesNotThrow(() => resolveHierarchyUserIds('mr1', [...edges, { subordinateUserId:'smd', managerUserId:'mr1' }], active, 'ALL_DESCENDANTS'));
assert.throws(() => assertAuthenticatedSession(null), /تسجيل/);
assert.throws(() => assertAuthenticatedSession({ id:'x', username:'x', name:'x', role:'REPRESENTATIVE', repId:'r', mustChangePassword:true }), /كلمة المرور/);
console.log('STEP 20 hierarchy/security matrix passed');
