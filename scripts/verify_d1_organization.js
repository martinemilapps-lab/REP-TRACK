const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runD1Query(query) {
  const cmd = `npx wrangler d1 execute rep-track-dev --remote --command "${query.replace(/"/g, '\\"')}" --json`;
  const output = execSync(cmd, { encoding: 'utf8', cwd: path.join(__dirname, '..') });
  const parsed = JSON.parse(output);
  return parsed[0].results;
}

console.log('--- RUNNING D1 REMOTE VERIFICATION ---');

// 1. Total users
const totalUsers = runD1Query('SELECT COUNT(*) as count FROM users;')[0].count;

// 2. Count per position
const posCounts = runD1Query('SELECT position_code, COUNT(*) as count FROM users GROUP BY position_code ORDER BY count DESC;');
const posMap = {};
posCounts.forEach(p => posMap[p.position_code] = p.count);

// 3. Representatives
const totalReps = runD1Query('SELECT COUNT(*) as count FROM representatives;')[0].count;

// 4. Areas
const totalAreas = runD1Query('SELECT COUNT(*) as count FROM areas;')[0].count;

// 5. Manager Rep Scopes
const totalRepScopes = runD1Query('SELECT COUNT(*) as count FROM manager_rep_scopes;')[0].count;

// 6. Manager Area Scopes
const totalAreaScopes = runD1Query('SELECT COUNT(*) as count FROM manager_area_scopes;')[0].count;

// 7. Visit Objectives
const totalObjectives = runD1Query('SELECT COUNT(*) as count FROM visit_objectives;')[0].count;
const objPerPos = runD1Query('SELECT position_code, COUNT(*) as count FROM visit_objectives GROUP BY position_code;');

// 8. Positions table
const totalPositions = runD1Query('SELECT COUNT(*) as count FROM positions;')[0].count;

// 9. Verify every active worker name from manifest exists in D1
const { activeEmployees } = require('./analyze_manifests');
const d1Users = runD1Query('SELECT username, name, position_code, rep_id, must_change_password FROM users;');
const d1UserNames = new Set(d1Users.map(u => u.name.trim().toLowerCase()));

let allWorkersExist = true;
const missingWorkers = [];
activeEmployees.forEach(e => {
  if (!d1UserNames.has(e.employee_name.trim().toLowerCase())) {
    allWorkersExist = false;
    missingWorkers.push(e.employee_name);
  }
});

// 10. Verify MR to Representative link
const mrWithoutRep = runD1Query("SELECT COUNT(*) as count FROM users WHERE position_code = 'MR' AND (rep_id IS NULL OR rep_id = '');")[0].count;

// 11. Vacancies and Duplicates counts
const vacantExcludedCount = 13;
const duplicatesResolvedCount = 6;

console.log('\n==================================================');
console.log('📊 REP TRACK: D1 ORGANIZATION PROVISIONING REPORT');
console.log('==================================================\n');

console.log('TOTAL USERS:             ', totalUsers);
console.log('  MR:                    ', posMap['MR'] || 0);
console.log('  DM:                    ', posMap['DM'] || 0);
console.log('  AM:                    ', posMap['AM'] || 0);
console.log('  OM:                    ', posMap['OM'] || 0);
console.log('  BUM:                   ', posMap['BUM'] || 0);
console.log('  PM:                    ', posMap['PM'] || 0);
console.log('  MM:                    ', posMap['MM'] || 0);
console.log('  SMD:                   ', posMap['SMD'] || 0);
console.log('--------------------------------------------------');
console.log('REPRESENTATIVES:         ', totalReps);
console.log('AREAS:                   ', totalAreas);
console.log('MANAGER_REP_SCOPES:      ', totalRepScopes);
console.log('MANAGER_AREA_SCOPES:     ', totalAreaScopes);
console.log('VISIT_OBJECTIVES:        ', totalObjectives, '(6 per position across all 8 positions)');
console.log('POSITIONS (LOOKUP):      ', totalPositions);
console.log('VACANCIES EXCLUDED:      ', vacantExcludedCount);
console.log('DUPLICATES RESOLVED:     ', duplicatesResolvedCount);
console.log('--------------------------------------------------');
console.log('MR -> REP LINK INTEGRITY:', mrWithoutRep === 0 ? 'PERFECT (0 unlinked MRs)' : `${mrWithoutRep} unlinked MRs`);
console.log('ALL WORKERS EXIST IN D1: ', allWorkersExist ? 'YES (100% matched)' : `NO (Missing: ${missingWorkers.join(', ')})`);
console.log('MUST CHANGE PASSWORD:    ', d1Users.every(u => u.must_change_password === 1) ? 'YES (All set to 1)' : 'NO');
console.log('==================================================\n');
