-- Task 5: additive Vacant manager-report context. Historical analysis tables remain dormant.
ALTER TABLE manager_activities ADD COLUMN report_context_type TEXT NOT NULL DEFAULT 'EMPLOYEE' CHECK(report_context_type IN ('EMPLOYEE','VACANT'));
ALTER TABLE manager_activity_entries ADD COLUMN manual_data TEXT;
ALTER TABLE manager_activity_extended_entries ADD COLUMN manual_data TEXT;
CREATE INDEX IF NOT EXISTS idx_mgr_activities_context ON manager_activities(report_context_type);
