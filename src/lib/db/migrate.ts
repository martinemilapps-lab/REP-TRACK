import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { client } from './index';
import { applyStep19Migration, assertExplicitMigrationTarget } from './step19Migration';

async function safeAddColumn(table: string, column: string, type: string) {
  try {
    await client.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${type};`);
    console.log(`✅ Added ${column} to ${table}`);
  } catch (err: unknown) {
    const errorMsg = (err as Error)?.message || String(err);
    if (errorMsg.includes('duplicate column') || errorMsg.includes('already exists')) {
      console.log(`ℹ️ ${column} already exists in ${table}`);
    } else {
      throw new Error(`Migration failed for ${table}.${column}`, { cause: err });
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
  await safeAddColumn('doctors', 'address', 'TEXT');
  await safeAddColumn('doctors', 'best_time', 'TEXT');
  await safeAddColumn('doctors', 'default_cycle', 'INTEGER DEFAULT 7');
  await safeAddColumn('doctors', 'target_products', 'TEXT');

  // distribution_branches
  await safeAddColumn('distribution_branches', 'rep_id', 'TEXT');
  await safeAddColumn('distribution_branches', 'address', 'TEXT');
  await safeAddColumn('distribution_branches', 'default_cycle', 'INTEGER DEFAULT 7');

  // branch_visits
  await safeAddColumn('branch_visits', 'cycle_days', 'INTEGER DEFAULT 0');
  await safeAddColumn('branch_visits', 'next_visit_date', 'TEXT');

  // objective columns for all 5 report sections
  await safeAddColumn('hospital_visits', 'objective', 'TEXT');
  await safeAddColumn('pharmacy_visits', 'objective', 'TEXT');
  await safeAddColumn('doctor_visits', 'objective', 'TEXT');
  await safeAddColumn('branch_visits', 'objective', 'TEXT');
  await safeAddColumn('product_availabilities', 'objective', 'TEXT');
  await safeAddColumn('product_availabilities', 'annual_target', 'INTEGER DEFAULT 0');
  await safeAddColumn('product_availabilities', 'avg_monthly_target', 'INTEGER DEFAULT 0');
  await safeAddColumn('product_availabilities', 'potentiality', 'INTEGER DEFAULT 0');

  await applyStep19Migration(client);

  console.log('✨ All migrations completed successfully!');
}

try {
  assertExplicitMigrationTarget(process.env.REP_TRACK_DATA_API_URL, process.argv.includes('--apply-existing-d1-migrations'));
} catch {
  console.error('No changes made. Explicit D1 target and --apply-existing-d1-migrations are required. See docs/step19-migration.md.');
  process.exit(1);
}

migrate()
  .then(() => {
    process.exit(0);
  })
  .catch(() => {
    console.error('D1 migration failed. No success is claimed; review the target before retrying.');
    process.exit(1);
  });
