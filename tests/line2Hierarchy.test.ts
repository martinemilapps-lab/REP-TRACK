import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolveHierarchyAncestorIds, resolveHierarchyUserIds } from '../src/lib/services/hierarchyService';
import { parseHierarchySql } from '../scripts/migrate_production_line2';

const sqlPath = process.env.HIERARCHY_SQL_PATH ?? 'C:\\Users\\Martin\\Downloads\\rep_track_hierarchy_d1.sql';
const expectedManagers: Record<string, string | null> = {
  'Sara Adel':'Bassem Hanna','Mostafa Ahmed':'Bassem Hanna','Mohamed Baiomy':'Bassem Hanna','Bassem Hanna':'Osama Bert','Esraa Shehata':'Marwa Shaaban','Marwa Shaaban':'Osama Bert','Philip Nayer':'Osama Bert','Fawzy Nasser':'Osama Bert','Engy Hosny':'Osama Bert','Helana Alex 1':'Mina Michel','Mina Michel':'Osama Bert','Amanda Medhat':'Rafik Maged','Rafik Maged':'Osama Bert','Marina Sameh':'Peter Abdel Nour','Ahmed Hassan':'Marian Adel','Marian Adel':'Peter Abdel Nour','Peter Abdel Nour':'Osama Bert','Ahmed El Mesalamy':'Peter Basily','Emad Latif':'Peter Basily','Peter Basily':'Osama Bert','Michael Antonyo':'Osama Bert','Randa Magdy':'Ashraf Shawky','Kirollos Adel':'Ashraf Shawky','John Amin':'Wael Atef','Ashraf Shawky':'Osama Bert','Wael Atef':'Osama Bert','Ahmed El Kot':'Maher Khamis','Maher Khamis':'Osama Bert','Osama Bert':'Maged Raouf','Maged Raouf':null,
};
const rows = existsSync(sqlPath)
  ? parseHierarchySql(sqlPath)
  : Object.entries(expectedManagers).map(([name, managerName]) => ({ name, managerName, title: '', territory: '', vacancy: false }));
const id = (name: string) => name.trim().toLowerCase().replace(/\s+/g, ' ');
assert.equal(rows.length, existsSync(sqlPath) ? 34 : 30);
assert.equal(rows.filter((row) => !row.vacancy).length, 30);
assert.equal(rows.filter((row) => row.managerName).length, 33);
assert.equal(rows.filter((row) => !row.managerName).length, 1);
if (existsSync(sqlPath)) assert.deepEqual(rows.filter((row) => row.vacancy).map((row) => id(row.name)), ['Vacant Maadi/Helwan', 'Vacant Nasr City', 'Vacant Alex 2', 'Vacant Minya'].map(id));
assert.deepEqual(Object.fromEntries(rows.filter((row) => !row.vacancy).map((row) => [id(row.name), row.managerName ? id(row.managerName) : null])), Object.fromEntries(Object.entries(expectedManagers).map(([name, manager]) => [id(name), manager ? id(manager) : null])));
const real = rows.filter((row) => !row.vacancy);
assert(rows.filter((row) => row.vacancy).every((row) => Boolean(row.managerName)));
const edges = real.filter((row) => row.managerName).map((row) => ({ subordinateUserId: id(row.name), managerUserId: id(row.managerName!) }));
const active = new Set(real.map((row) => id(row.name)));
const directs = (manager: string) => new Set(resolveHierarchyUserIds(id(manager), edges, active, 'DIRECT_REPORTS'));
const descendants = (manager: string) => new Set(resolveHierarchyUserIds(id(manager), edges, active, 'ALL_DESCENDANTS'));
const ancestors = (employee: string) => resolveHierarchyAncestorIds(id(employee), edges, active);
assert.deepEqual(directs('Maged Raouf'), new Set([id('Osama Bert')]));
assert.deepEqual(directs('Osama Bert'), new Set(['Bassem Hanna', 'Marwa Shaaban', 'Philip Nayer', 'Fawzy Nasser', 'Engy Hosny', 'Mina Michel', 'Rafik Maged', 'Peter Abdel Nour', 'Peter Basily', 'Michael Antonyo', 'Ashraf Shawky', 'Wael Atef', 'Maher Khamis'].map(id)));
assert.deepEqual(directs('Bassem Hanna'), new Set(['Sara Adel', 'Mostafa Ahmed', 'Mohamed Baiomy'].map(id)));
assert.deepEqual(directs('Marwa Shaaban'), new Set([id('Esraa Shehata')]));
assert.deepEqual(directs('Mina Michel'), new Set([id('Helana Alex 1')]));
assert.deepEqual(directs('Rafik Maged'), new Set([id('Amanda Medhat')]));
assert.deepEqual(directs('Michael Antonyo'), new Set());
assert.deepEqual(directs('Ashraf Shawky'), new Set(['Randa Magdy', 'Kirollos Adel'].map(id)));
assert.deepEqual(ancestors('Rafik Maged'), ['Osama Bert', 'Maged Raouf'].map(id));
assert.deepEqual(ancestors('Ahmed El Kot'), ['Maher Khamis', 'Osama Bert', 'Maged Raouf'].map(id));
assert.deepEqual(ancestors('Ahmed Hassan'), ['Marian Adel', 'Peter Abdel Nour', 'Osama Bert', 'Maged Raouf'].map(id));
assert.deepEqual(ancestors('John Amin'), ['Wael Atef', 'Osama Bert', 'Maged Raouf'].map(id));
assert.equal(descendants('Michael Antonyo').size, 0);
assert(descendants('Peter Abdel Nour').has(id('Ahmed Hassan')));
assert(!descendants('Rafik Maged').has(id('Ahmed El Kot')));
assert.equal(new Set(edges.map((edge) => `${edge.subordinateUserId}:${edge.managerUserId}`)).size, edges.length);
assert(edges.every((edge) => edge.subordinateUserId !== edge.managerUserId));
for (const person of real) assert(!ancestors(person.name).includes(id(person.name)));
const hierarchyServiceSource = readFileSync('src/lib/services/hierarchyService.ts', 'utf8');
assert.match(hierarchyServiceSource, /getDirectManagerIds[\s\S]*?assertAuthenticatedSession\(session\)/);
assert.match(hierarchyServiceSource, /getAncestorIds[\s\S]*?assertAuthenticatedSession\(session\)/);
console.log('Authoritative SQL hierarchy: 30 employees, 4 vacancies, 33 relationships, ancestor and isolation checks passed');
