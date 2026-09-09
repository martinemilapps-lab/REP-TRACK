import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveHierarchyAncestorIds, resolveHierarchyUserIds } from '../src/lib/services/hierarchyService';

const edges = [
  { subordinateUserId: 'ahmed', managerUserId: 'maher' },
  { subordinateUserId: 'maher', managerUserId: 'michael' },
  { subordinateUserId: 'michael', managerUserId: 'osama' },
  { subordinateUserId: 'osama', managerUserId: 'maged' },
  { subordinateUserId: 'helana', managerUserId: 'mina' },
  { subordinateUserId: 'mina', managerUserId: 'osama' },
  { subordinateUserId: 'unrelated', managerUserId: 'other-manager' },
];
const active = new Set(['ahmed', 'maher', 'michael', 'osama', 'maged', 'helana', 'mina', 'unrelated', 'other-manager']);

assert.deepEqual(resolveHierarchyAncestorIds('ahmed', edges, active), ['maher', 'michael', 'osama', 'maged']);
assert.deepEqual(resolveHierarchyUserIds('maher', edges, active, 'DIRECT_REPORTS'), ['ahmed']);
assert.deepEqual(new Set(resolveHierarchyUserIds('maged', edges, active, 'ALL_DESCENDANTS')), new Set(['osama', 'michael', 'mina', 'maher', 'helana', 'ahmed']));
assert.deepEqual(resolveHierarchyAncestorIds('helana', edges, active), ['mina', 'osama', 'maged']);
assert(!resolveHierarchyUserIds('maher', edges, active, 'ALL_DESCENDANTS').includes('unrelated'));

const operationalService = readFileSync('src/lib/services/organizationService.ts', 'utf8');
assert(!operationalService.includes("systemRole === 'ADMIN' || positionCode === 'SMD'"));

console.log('Line 2 hierarchy, skipped-level, tampering, and Admin-scope regressions passed');
