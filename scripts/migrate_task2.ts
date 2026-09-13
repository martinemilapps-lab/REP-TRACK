import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { client } from '../src/lib/db';

async function main() {
  const info = await client.execute('PRAGMA table_info(manager_activities)') as Array<{ name: string }>;
  if (!info.some((column) => column.name === 'event_feedback')) {
    await client.execute('ALTER TABLE manager_activities ADD COLUMN event_feedback TEXT');
  }
  await client.execute("CREATE TABLE IF NOT EXISTS manager_activity_entries (id TEXT PRIMARY KEY NOT NULL, activity_id TEXT NOT NULL REFERENCES manager_activities(id) ON DELETE CASCADE, period TEXT NOT NULL CHECK(period IN ('AM','PM')), entry_type TEXT NOT NULL CHECK(entry_type IN ('HOSPITAL','DIRECT_DOCTOR')), hospital_id TEXT REFERENCES hospitals(id) ON DELETE RESTRICT, doctor_id TEXT REFERENCES doctors(id) ON DELETE RESTRICT, name_snapshot TEXT NOT NULL, specialty_snapshot TEXT, general_comment TEXT, display_order INTEGER NOT NULL DEFAULT 0)");
  await client.execute('CREATE INDEX IF NOT EXISTS idx_mgr_activity_entries_activity ON manager_activity_entries(activity_id)');
  await client.execute('CREATE INDEX IF NOT EXISTS idx_mgr_activity_entries_period ON manager_activity_entries(period)');
  await client.execute('CREATE TABLE IF NOT EXISTS manager_activity_entry_doctors (id TEXT PRIMARY KEY NOT NULL, entry_id TEXT NOT NULL REFERENCES manager_activity_entries(id) ON DELETE CASCADE, doctor_id TEXT NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT, name_snapshot TEXT NOT NULL, specialty_snapshot TEXT, general_comment TEXT, display_order INTEGER NOT NULL DEFAULT 0)');
  await client.execute('CREATE INDEX IF NOT EXISTS idx_mgr_activity_entry_doctors_entry ON manager_activity_entry_doctors(entry_id)');
  await client.execute('CREATE TABLE IF NOT EXISTS manager_activity_products (activity_id TEXT NOT NULL REFERENCES manager_activities(id) ON DELETE CASCADE, product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT, product_name_snapshot TEXT NOT NULL, UNIQUE(activity_id, product_id))');
  console.log('Task 2 additive migration complete');
}
main().catch((error) => { console.error(error instanceof Error ? error.message : 'Migration failed'); process.exit(1); });
