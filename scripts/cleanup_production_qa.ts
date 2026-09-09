import * as dotenv from 'dotenv';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { client } from '../src/lib/db';

dotenv.config({ path: '.env.local', quiet: true });

const marioId = 'u-pm1';
const testRepresentativeId = 'rep-master-lists-test';
const testHospitalIds = [
  '9e0c0d4f-14a8-47c7-b6c4-933f7d728fd6',
  'c2ceb2f4-5149-4f17-b40f-4740c05603dd',
  '10d1e7fb-361e-4d35-aa11-0bfa3ef3ddae',
  '935b1bcc-1cee-4eee-a36a-5f2f4f3d6552',
  '2dc7e2be-22b5-4172-95a9-04137cb48de8',
  '7ce9145d-afc1-409e-abb6-8324a9b7cc13',
  'b69e978a-4c28-422c-9c9e-588c5f8ceba4',
] as const;

const placeholders = testHospitalIds.map(() => '?').join(',');

async function snapshot() {
  const [hospitals, visits, availability, representatives, doctors, pharmacies, admins] = await Promise.all([
    client.execute(`select * from hospitals where id in (${placeholders}) order by id`, [...testHospitalIds]),
    client.execute(`select * from hospital_visits where hospital_id in (${placeholders}) order by id`, [...testHospitalIds]),
    client.execute(`select * from product_availabilities where hospital_id in (${placeholders}) order by id`, [...testHospitalIds]),
    client.execute('select * from representatives where id = ?', [testRepresentativeId]),
    client.execute('select * from doctors where rep_id = ? order by id', [testRepresentativeId]),
    client.execute('select * from pharmacies where rep_id = ? order by id', [testRepresentativeId]),
    client.execute("select id, username, name, position_code, role, system_role, is_active from users where system_role = 'ADMIN' order by username"),
  ]);
  return { hospitals, visits, availability, representatives, doctors, pharmacies, admins };
}

async function main() {
  const before = await snapshot();
  if (before.hospitals.length !== testHospitalIds.length) throw new Error('Safety stop: the exact QA hospital inventory changed.');
  if (before.representatives.length !== 1 || before.representatives[0]?.name !== 'Test Master Rep') {
    throw new Error('Safety stop: the exact QA representative inventory changed.');
  }
  const mario = await client.execute(
    "select id, username, name, position_code, role, system_role, is_active from users where lower(trim(name)) = 'mario nader' and username = 'PM1'",
  );
  if (mario.length !== 1 || mario[0]?.id !== marioId) throw new Error('Safety stop: exact Mario Nader / PM1 account not uniquely resolved.');

  if (!process.argv.includes('--apply-production-cleanup')) {
    console.log(JSON.stringify({ mode: 'preflight', counts: Object.fromEntries(Object.entries(before).map(([key, rows]) => [key, rows.length])), mario: mario[0] }, null, 2));
    return;
  }

  const backupDirectory = mkdtempSync(join(tmpdir(), 'rep-track-production-cleanup-'));
  const backupPath = join(backupDirectory, 'affected-business-rows.json');
  writeFileSync(backupPath, JSON.stringify({ capturedAt: new Date().toISOString(), ...before }, null, 2), { encoding: 'utf8', flag: 'wx' });

  await client.execute(`delete from product_availabilities where hospital_id in (${placeholders})`, [...testHospitalIds]);
  await client.execute(`delete from hospital_visits where hospital_id in (${placeholders})`, [...testHospitalIds]);
  await client.execute('delete from doctors where rep_id = ?', [testRepresentativeId]);
  await client.execute('delete from pharmacies where rep_id = ?', [testRepresentativeId]);
  await client.execute(`delete from hospitals where id in (${placeholders}) or rep_id = ?`, [...testHospitalIds, testRepresentativeId]);
  await client.execute('delete from representatives where id = ?', [testRepresentativeId]);

  await client.execute("delete from sessions where user_id <> ? and user_id in (select id from users where system_role = 'ADMIN')", [marioId]);
  await client.execute("update users set system_role = case when role = 'REPRESENTATIVE' then 'USER' else 'MANAGER' end, updated_at = ? where id <> ? and system_role = 'ADMIN'", [Date.now(), marioId]);
  await client.execute("update users set system_role = 'ADMIN', updated_at = ? where id = ?", [Date.now(), marioId]);

  const after = await snapshot();
  const remainingNamed = await client.execute(
    "select id, name from hospitals where lower(trim(name)) like 'test %' union all select id, name from representatives where lower(trim(name)) like 'test %'",
  );
  if (after.hospitals.length || after.visits.length || after.availability.length || after.representatives.length || after.doctors.length || after.pharmacies.length || remainingNamed.length) {
    throw new Error('Cleanup verification failed: one or more exact QA artifacts remain.');
  }
  if (after.admins.length !== 1 || after.admins[0]?.id !== marioId) throw new Error('Admin lockdown verification failed.');

  console.log(JSON.stringify({ mode: 'applied', backupPath, removed: Object.fromEntries(Object.entries(before).filter(([key]) => key !== 'admins').map(([key, rows]) => [key, rows.length])), adminsBefore: before.admins, adminsAfter: after.admins }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
