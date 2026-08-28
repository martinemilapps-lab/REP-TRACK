import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { client } from './index';

async function safeAddColumn(table: string, column: string, type: string) {
  try {
    await client.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${type};`);
    console.log(`✅ Added ${column} to ${table}`);
  } catch (err: unknown) {
    const errorMsg = (err as Error)?.message || String(err);
    if (errorMsg.includes('duplicate column') || errorMsg.includes('already exists')) {
      console.log(`ℹ️ ${column} already exists in ${table}`);
    } else {
      console.log(`ℹ️ Note for ${table}.${column}:`, errorMsg);
    }
  }
}

async function migrate() {
  console.log('🔄 Checking and applying database migrations for My Lists and visit cycles...');

  // hospitals
  await safeAddColumn('hospitals', 'rep_id', 'TEXT');
  await safeAddColumn('hospitals', 'doctor_names', 'TEXT');
  await safeAddColumn('hospitals', 'default_cycle', 'INTEGER DEFAULT 7');
  await safeAddColumn('hospitals', 'target_products', 'TEXT');

  // pharmacies
  await safeAddColumn('pharmacies', 'rep_id', 'TEXT');
  await safeAddColumn('pharmacies', 'default_cycle', 'INTEGER DEFAULT 7');
  await safeAddColumn('pharmacies', 'target_products', 'TEXT');

  // doctors
  await safeAddColumn('doctors', 'rep_id', 'TEXT');
  await safeAddColumn('doctors', 'best_time', 'TEXT');
  await safeAddColumn('doctors', 'default_cycle', 'INTEGER DEFAULT 7');
  await safeAddColumn('doctors', 'target_products', 'TEXT');

  // distribution_branches
  await safeAddColumn('distribution_branches', 'rep_id', 'TEXT');
  await safeAddColumn('distribution_branches', 'default_cycle', 'INTEGER DEFAULT 7');

  // branch_visits
  await safeAddColumn('branch_visits', 'cycle_days', 'INTEGER DEFAULT 0');
  await safeAddColumn('branch_visits', 'next_visit_date', 'TEXT');

  console.log('✨ All migrations completed successfully!');
}

migrate()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration error:', err);
    process.exit(1);
  });
