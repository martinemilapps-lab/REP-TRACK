-- Task 4: additive AM/PM context. Safe to re-run through scripts/migrate_task4.ts.
ALTER TABLE weekly_plans ADD COLUMN structured_plan TEXT;
ALTER TABLE manager_weekly_plans ADD COLUMN selected_rep_id TEXT REFERENCES representatives(id) ON DELETE RESTRICT;
ALTER TABLE manager_weekly_plans ADD COLUMN structured_plan TEXT;
ALTER TABLE manager_activities ADD COLUMN selected_rep_id TEXT REFERENCES representatives(id) ON DELETE RESTRICT;
ALTER TABLE manager_activities ADD COLUMN activity_selections TEXT;
ALTER TABLE manager_activity_entries ADD COLUMN pharmacy_id TEXT REFERENCES pharmacies(id) ON DELETE RESTRICT;
ALTER TABLE manager_activity_entries ADD COLUMN branch_id TEXT REFERENCES distribution_branches(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_mgr_plans_selected_rep ON manager_weekly_plans(selected_rep_id);
CREATE INDEX IF NOT EXISTS idx_mgr_activities_selected_rep ON manager_activities(selected_rep_id);
DROP INDEX IF EXISTS idx_mgr_weekly_plans_user_week;
CREATE UNIQUE INDEX IF NOT EXISTS idx_mgr_weekly_plans_user_rep_week ON manager_weekly_plans(user_id,selected_rep_id,start_date);
