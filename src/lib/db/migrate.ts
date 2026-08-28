import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { client } from './index';

async function migrate() {
  console.log('🔄 Checking and applying database migrations...');
  try {
    // Add doctor_names column if not already present
    await client.execute('ALTER TABLE hospital_visits ADD COLUMN doctor_names TEXT;');
    console.log('✅ Added doctor_names column to hospital_visits');
  } catch (err: unknown) {
    const errorMsg = (err as Error)?.message || String(err);
    if (errorMsg.includes('duplicate column') || errorMsg.includes('already exists')) {
      console.log('ℹ️ doctor_names column already exists');
    } else {
      console.log('ℹ️ Migration note:', errorMsg);
    }
  }
}

migrate()
  .then(() => {
    console.log('✨ Migration finished');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration error:', err);
    process.exit(1);
  });
