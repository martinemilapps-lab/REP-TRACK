const fs = require('fs');
const path = require('path');

function parseCSV(text) {
  const rows = [];
  let row = [];
  let inQuote = false;
  let cell = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuote && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else {
        inQuote = !inQuote;
      }
    } else if (char === ',' && !inQuote) {
      row.push(cell.trim());
      cell = '';
    } else if ((char === '\n' || char === '\r') && !inQuote) {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(cell.trim());
      if (row.some(c => c.length > 0)) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());
    if (row.some(c => c.length > 0)) rows.push(row);
  }
  return rows;
}

const employeeCsv = fs.readFileSync(path.join(__dirname, '../docs/data-migration/employee-account-manifest.csv'), 'utf8');
const empRows = parseCSV(employeeCsv);
const empHeader = empRows[0];
const employees = empRows.slice(1).map(r => {
  const obj = {};
  empHeader.forEach((h, i) => obj[h] = r[i] || '');
  return obj;
});

const hierarchyCsv = fs.readFileSync(path.join(__dirname, '../docs/data-migration/hierarchy-manifest.csv'), 'utf8');
const hierRows = parseCSV(hierarchyCsv);
const hierHeader = hierRows[0];
const hierarchy = hierRows.slice(1).map(r => {
  const obj = {};
  hierHeader.forEach((h, i) => obj[h] = r[i] || '');
  return obj;
});

console.log('Total Employee Manifest rows:', employees.length);
console.log('Total Hierarchy Manifest rows:', hierarchy.length);

const statusCounts = {};
employees.forEach(e => {
  statusCounts[e.account_status] = (statusCounts[e.account_status] || 0) + 1;
});
console.log('Account status counts:', statusCounts);

const activeEmployees = employees.filter(e => e.account_status === 'ACTIVE');
console.log('Active employees count:', activeEmployees.length);

const posCounts = {};
activeEmployees.forEach(e => {
  posCounts[e.normalized_position] = (posCounts[e.normalized_position] || 0) + 1;
});
console.log('Active positions breakdown:', posCounts);

const vacantRows = employees.filter(e => e.account_status === 'VACANT');
console.log('Vacant rows count:', vacantRows.length);

const duplicateRows = employees.filter(e => e.account_status === 'DUPLICATE_INACTIVE');
console.log('Duplicate inactive rows count:', duplicateRows.length);

// Map active employees by name
const activeEmpByName = new Map();
activeEmployees.forEach(e => {
  activeEmpByName.set(e.employee_name.trim().toLowerCase(), e);
});

// Calculate Rep Scopes and Area Scopes
// 1. All managers in hierarchy (DM, AM, OM, BUM)
const repScopesAll = new Set();
const areaScopesAll = new Set();

// 2. Only DM and BUM
const repScopesDMBUM = new Set();
const areaScopesDMBUM = new Set();

hierarchy.forEach(h => {
  const empName = h.employee_name.trim().toLowerCase();
  const emp = activeEmpByName.get(empName);
  const isMR = emp && emp.normalized_position === 'MR';

  const dmList = h.dm ? h.dm.split(',').map(s => s.trim()).filter(Boolean) : [];
  const amList = h.am ? h.am.split(',').map(s => s.trim()).filter(Boolean) : [];
  const omList = h.om ? h.om.split(',').map(s => s.trim()).filter(Boolean) : [];
  const bumList = h.bum ? h.bum.split(',').map(s => s.trim()).filter(Boolean) : [];

  const terr = h.territory ? h.territory.trim() : '';

  // DM + BUM
  [...dmList, ...bumList].forEach(mgrName => {
    if (mgrName.toLowerCase() === 'none') return;
    const mgr = activeEmpByName.get(mgrName.toLowerCase());
    if (!mgr) return;

    if (isMR) {
      repScopesDMBUM.add(`${mgr.proposed_username}:${emp.proposed_username}`);
      if (terr) areaScopesDMBUM.add(`${mgr.proposed_username}:${terr}`);
    } else if (terr) {
      areaScopesDMBUM.add(`${mgr.proposed_username}:${terr}`);
    }
  });

  // All managers (DM, AM, OM, BUM)
  [...dmList, ...amList, ...omList, ...bumList].forEach(mgrName => {
    if (mgrName.toLowerCase() === 'none') return;
    const mgr = activeEmpByName.get(mgrName.toLowerCase());
    if (!mgr) return;

    if (isMR) {
      repScopesAll.add(`${mgr.proposed_username}:${emp.proposed_username}`);
      if (terr) areaScopesAll.add(`${mgr.proposed_username}:${terr}`);
    } else if (terr) {
      areaScopesAll.add(`${mgr.proposed_username}:${terr}`);
    }
  });

  // If the employee is themselves a manager with a territory, add their own area scope
  if (emp && ['DM', 'AM', 'OM', 'BUM'].includes(emp.normalized_position) && terr) {
    areaScopesDMBUM.add(`${emp.proposed_username}:${terr}`);
    areaScopesAll.add(`${emp.proposed_username}:${terr}`);
  }
});

console.log('--- SCOPES BREAKDOWN ---');
console.log('Case 1 (All: DM, AM, OM, BUM):');
console.log('  manager_rep_scopes:', repScopesAll.size);
console.log('  manager_area_scopes:', areaScopesAll.size);

console.log('Case 2 (Only DM and BUM):');
console.log('  manager_rep_scopes:', repScopesDMBUM.size);
console.log('  manager_area_scopes:', areaScopesDMBUM.size);

module.exports = {
  employees,
  hierarchy,
  activeEmployees,
  vacantRows,
  duplicateRows,
  activeEmpByName,
  repScopesAll,
  areaScopesAll,
  repScopesDMBUM,
  areaScopesDMBUM
};



