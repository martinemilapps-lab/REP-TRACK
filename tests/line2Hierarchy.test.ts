import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolveHierarchyAncestorIds, resolveHierarchyUserIds } from '../src/lib/services/hierarchyService';
import { parseLine2Workbook } from '../scripts/migrate_production_line2';

const workbookPath = process.env.LINE2_WORKBOOK_PATH ?? 'C:\\Users\\Martin\\Downloads\\Final Areas sheet - Line 2.xlsx';
const expectedManagers: Record<string, string | null> = {
  'Sara Adel':'Bassem Hanna','Mostafa Ahmed':'Bassem Hanna','Mohamed Baiomy':'Bassem Hanna','Bassem Hanna':'Osama Bert','Esraa Shehata':'Marwa Shaaban','Marwa Shaaban':'Osama Bert','Philip Nayer':'Osama Bert','Fawzy Nasser':'Osama Bert','Engy Hosny':'Osama Bert','Helana Alex 1':'Mina Michel','Mina Michel':'Osama Bert','Amanda Medhat':'Rafik Maged','Rafik Maged':'Michael Antonyo','Marina Sameh':'Peter Abdel Nour','Ahmed Hassan':'Marian Adel','Marian Adel':'Peter Abdel Nour','Peter Abdel Nour':'Osama Bert','Ahmed El Mesalamy':'Peter Basily','Emad Latif':'Peter Basily','Peter Basily':'Michael Antonyo','Michael Antonyo':'Osama Bert','Randa Magdy':'Ashraf Shawky','Kirollos Adel':'Ashraf Shawky','John Amin':'Wael Atef','Ashraf Shawky':'Osama Bert','Wael Atef':'Osama Bert','Ahmed El Kot':'Maher Khamis','Maher Khamis':'Michael Antonyo','Osama Bert':'Maged Raouf','Maged Raouf':null,
};
const rows = existsSync(workbookPath)
  ? parseLine2Workbook(workbookPath)
  : Object.entries(expectedManagers).map(([name, managerName]) => ({ name, managerName, title: '', territory: '', vacancy: false }));
const id = (name: string) => name.trim().toLowerCase().replace(/\s+/g, ' ');
assert.equal(rows.length, existsSync(workbookPath) ? 34 : 30);
assert.equal(rows.filter((row) => !row.vacancy).length, 30);
if (existsSync(workbookPath)) assert.deepEqual(rows.filter((row) => row.vacancy).map((row) => id(row.name)), ['Vacant Maadi/Helwan', 'Vacant Nasr City', 'Vacant Alex 2', 'Vacant Minya'].map(id));
assert.deepEqual(Object.fromEntries(rows.filter((row) => !row.vacancy).map((row) => [id(row.name), row.managerName ? id(row.managerName) : null])), Object.fromEntries(Object.entries(expectedManagers).map(([name, manager]) => [id(name), manager ? id(manager) : null])));
const real = rows.filter((row) => !row.vacancy);
const edges = real.filter((row) => row.managerName).map((row) => ({ subordinateUserId: id(row.name), managerUserId: id(row.managerName!) }));
const active = new Set(real.map((row) => id(row.name)));
const directs = (manager: string) => new Set(resolveHierarchyUserIds(id(manager), edges, active, 'DIRECT_REPORTS'));
const descendants = (manager: string) => new Set(resolveHierarchyUserIds(id(manager), edges, active, 'ALL_DESCENDANTS'));
const ancestors = (employee: string) => resolveHierarchyAncestorIds(id(employee), edges, active);
assert.deepEqual(directs('Maged Raouf'), new Set([id('Osama Bert')]));
assert.deepEqual(directs('Osama Bert'), new Set(['Bassem Hanna', 'Marwa Shaaban', 'Philip Nayer', 'Fawzy Nasser', 'Engy Hosny', 'Mina Michel', 'Peter Abdel Nour', 'Michael Antonyo', 'Ashraf Shawky', 'Wael Atef'].map(id)));
assert.deepEqual(directs('Bassem Hanna'), new Set(['Sara Adel', 'Mostafa Ahmed', 'Mohamed Baiomy'].map(id)));
assert.deepEqual(directs('Marwa Shaaban'), new Set([id('Esraa Shehata')]));
assert.deepEqual(directs('Mina Michel'), new Set([id('Helana Alex 1')]));
assert.deepEqual(directs('Rafik Maged'), new Set([id('Amanda Medhat')]));
assert.deepEqual(directs('Ashraf Shawky'), new Set(['Randa Magdy', 'Kirollos Adel'].map(id)));
assert.deepEqual(ancestors('Rafik Maged'), ['Michael Antonyo', 'Osama Bert', 'Maged Raouf'].map(id));
assert.deepEqual(ancestors('Ahmed El Kot'), ['Maher Khamis', 'Michael Antonyo', 'Osama Bert', 'Maged Raouf'].map(id));
assert.deepEqual(ancestors('Ahmed Hassan'), ['Marian Adel', 'Peter Abdel Nour', 'Osama Bert', 'Maged Raouf'].map(id));
assert.deepEqual(ancestors('John Amin'), ['Wael Atef', 'Osama Bert', 'Maged Raouf'].map(id));
for (const name of ['Amanda Medhat', 'Ahmed El Mesalamy', 'Emad Latif', 'Ahmed El Kot']) assert(descendants('Michael Antonyo').has(id(name)));
assert(descendants('Peter Abdel Nour').has(id('Ahmed Hassan')));
assert(!descendants('Rafik Maged').has(id('Ahmed El Kot')));
assert.equal(new Set(edges.map((edge) => `${edge.subordinateUserId}:${edge.managerUserId}`)).size, edges.length);
assert(edges.every((edge) => edge.subordinateUserId !== edge.managerUserId));
for (const person of real) assert(!ancestors(person.name).includes(id(person.name)));
console.log('Line 2 workbook hierarchy: 30 employees, 4 vacancies, direct, descendant, ancestor and isolation checks passed');
