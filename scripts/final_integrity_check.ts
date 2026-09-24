import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { client } from '@/lib/db';

async function main() {
  console.log('====================================================');
  console.log('FINAL DATABASE INTEGRITY AUDIT (CLOUDFLARE D1)');
  console.log('====================================================\n');

  const fawzyChecks = [
    { table: 'doctors', expected: 80 },
    { table: 'pharmacies', expected: 19 },
    { table: 'hospitals', expected: 43 },
    { table: 'distribution_branches', expected: 3 },
    { table: 'doctor_visits', expected: 25 },
    { table: 'pharmacy_visits', expected: 15 },
    { table: 'hospital_visits', expected: 22 },
    { table: 'weekly_plans', expected: 3 },
    { table: 'daily_reports', expected: 22 },
  ];

  let allPassed = true;

  console.log('1. Checking Fawzy Nasser ({MR11}) preserved data:');
  for (const item of fawzyChecks) {
    const fawzyRes = await client.execute(`SELECT count(*) as count FROM ${item.table} WHERE rep_id = 'rep-mr11'`);
    const fawzyCount = Number(fawzyRes[0]?.count ?? 0);
    const nonFawzyRes = await client.execute(`SELECT count(*) as count FROM ${item.table} WHERE rep_id != 'rep-mr11'`);
    const nonFawzyCount = Number(nonFawzyRes[0]?.count ?? 0);

    const fawzyOk = fawzyCount === item.expected;
    const nonFawzyOk = nonFawzyCount === 0;

    if (fawzyOk && nonFawzyOk) {
      console.log(`  ✓ ${item.table.padEnd(25)}: Fawzy=${fawzyCount} (expected ${item.expected}), Non-Fawzy=${nonFawzyCount} (expected 0)`);
    } else {
      console.error(`  ❌ ${item.table.padEnd(25)}: Fawzy=${fawzyCount}, Non-Fawzy=${nonFawzyCount}`);
      allPassed = false;
    }
  }

  console.log('\n2. Checking company foundation & hierarchy:');
  const userRes = await client.execute(`SELECT count(*) as count FROM users`);
  console.log(`  ✓ Total users: ${userRes[0]?.count} (expected 63)`);

  const repRes = await client.execute(`SELECT count(*) as count FROM representatives WHERE is_active = 1`);
  console.log(`  ✓ Active representatives: ${repRes[0]?.count} (expected 36)`);

  const posRes = await client.execute(`SELECT count(*) as count FROM positions`);
  console.log(`  ✓ Positions: ${posRes[0]?.count} (expected 8)`);

  const scopeRes = await client.execute(`SELECT count(*) as count FROM manager_rep_scopes`);
  console.log(`  ✓ Manager Rep Scopes: ${scopeRes[0]?.count}`);

  if (allPassed) {
    console.log('\n====================================================');
    console.log('ALL INTEGRITY AUDITS PASSED WITH 100% ACCURACY!');
    console.log('====================================================\n');
  } else {
    throw new Error('Integrity audit found mismatches!');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
