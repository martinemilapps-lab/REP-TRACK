-- Additive Task 3 migration. Applied idempotently by scripts/migrate_task3.ts.
-- Historical columns and rows are intentionally retained.
ALTER TABLE pharmacies ADD COLUMN distributors TEXT NOT NULL DEFAULT '[]';
ALTER TABLE pharmacies ADD COLUMN distributor_other TEXT;
ALTER TABLE trainings ADD COLUMN location TEXT;
-- Repeatable child tables are created with CREATE TABLE IF NOT EXISTS by the runner.
