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

  // STEP 19: Manager Activities table
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS manager_activities (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        activity_type TEXT NOT NULL,
        activity_date TEXT NOT NULL,
        visit_type TEXT,
        accompanied_person TEXT,
        morning_hospital_name TEXT,
        morning_doctor_names TEXT,
        morning_specialty TEXT,
        morning_hospital_comment TEXT,
        afternoon_doctor_names TEXT,
        afternoon_specialty TEXT,
        afternoon_doctor_comment TEXT,
        afternoon_pharmacy_name TEXT,
        afternoon_pharmacy_comment TEXT,
        general_comment TEXT,
        event_name TEXT,
        event_type TEXT,
        location TEXT,
        attendees TEXT,
        budget TEXT,
        training_type TEXT,
        training_topic TEXT,
        training_location TEXT,
        participants TEXT,
        work_summary TEXT,
        description TEXT,
        notes TEXT,
        submitted_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
      );
    `);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_mgr_activities_user ON manager_activities(user_id);`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_mgr_activities_date ON manager_activities(activity_date);`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_mgr_activities_type ON manager_activities(activity_type);`);
    console.log('✅ Created manager_activities table and indexes');
  } catch (err) {
    console.log('ℹ️ Note for manager_activities:', (err as Error)?.message || err);
  }

  // STEP 19: Manager Weekly Plans table
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS manager_weekly_plans (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        week_label TEXT,
        saturday_am TEXT DEFAULT '',
        saturday_pm TEXT DEFAULT '',
        sunday_am TEXT DEFAULT '',
        sunday_pm TEXT DEFAULT '',
        monday_am TEXT DEFAULT '',
        monday_pm TEXT DEFAULT '',
        tuesday_am TEXT DEFAULT '',
        tuesday_pm TEXT DEFAULT '',
        wednesday_am TEXT DEFAULT '',
        wednesday_pm TEXT DEFAULT '',
        thursday_am TEXT DEFAULT '',
        thursday_pm TEXT DEFAULT '',
        friday_am TEXT DEFAULT '',
        friday_pm TEXT DEFAULT '',
        status TEXT NOT NULL DEFAULT 'Submitted',
        manager_notes TEXT,
        submitted_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
      );
    `);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_mgr_weekly_plans_user ON manager_weekly_plans(user_id);`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_mgr_weekly_plans_dates ON manager_weekly_plans(start_date, end_date);`);
    console.log('✅ Created manager_weekly_plans table and indexes');
  } catch (err) {
    console.log('ℹ️ Note for manager_weekly_plans:', (err as Error)?.message || err);
  }

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
