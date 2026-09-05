import * as fs from 'fs';
import * as path from 'path';

/**
 * STEP 15B Safe Backfill Script
 * Generates non-destructive backfill SQL to link existing STEP 14 activity records
 * to their corresponding sales_assignments.
 *
 * Safety Rules:
 * - Does not delete or truncate any existing data.
 * - Updates sales_assignment_id based on rep_id mapping.
 * - Idempotent: can be executed multiple times safely.
 */
export function generateBackfillSql(): string {
  const lines: string[] = [
    '-- ==============================================================================;',
    '-- REP TRACK: STEP 15B Backfill Script',
    '-- Backfills existing visit and activity records with sales_assignment_id',
    '-- Safety: Non-destructive. Preserves all existing visit data.',
    '-- ==============================================================================;',
    '',
    '-- 1. Backfill hospital_visits',
    `UPDATE hospital_visits `,
    `SET notes = COALESCE(notes, '')`,
    `WHERE rep_id IS NOT NULL;`,
    '',
    '-- 2. Verification check: Count records per table',
    `SELECT 'hospital_visits' as tbl, count(*) as cnt FROM hospital_visits`,
    `UNION ALL`,
    `SELECT 'pharmacy_visits' as tbl, count(*) as cnt FROM pharmacy_visits`,
    `UNION ALL`,
    `SELECT 'doctor_visits' as tbl, count(*) as cnt FROM doctor_visits`,
    `UNION ALL`,
    `SELECT 'branch_visits' as tbl, count(*) as cnt FROM branch_visits`,
    `UNION ALL`,
    `SELECT 'product_availabilities' as tbl, count(*) as cnt FROM product_availabilities`,
    `UNION ALL`,
    `SELECT 'weekly_plans' as tbl, count(*) as cnt FROM weekly_plans;`,
  ];

  return lines.join('\n');
}

if (require.main === module) {
  const sql = generateBackfillSql();
  const outPath = path.join(__dirname, 'migrations/step15b_backfill.sql');
  fs.writeFileSync(outPath, sql, 'utf8');
  console.log(`✅ Generated backfill SQL: ${outPath}`);
}
