-- STEP 19 only. Apply through the reviewed D1 gateway procedure.
-- Existing duplicate weeks intentionally cause failure; no data is deleted.

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

CREATE INDEX IF NOT EXISTS idx_mgr_activities_user ON manager_activities(user_id);

CREATE INDEX IF NOT EXISTS idx_mgr_activities_date ON manager_activities(activity_date);

CREATE INDEX IF NOT EXISTS idx_mgr_activities_type ON manager_activities(activity_type);

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

CREATE INDEX IF NOT EXISTS idx_mgr_weekly_plans_user ON manager_weekly_plans(user_id);

CREATE INDEX IF NOT EXISTS idx_mgr_weekly_plans_dates ON manager_weekly_plans(start_date, end_date);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mgr_weekly_plans_user_week ON manager_weekly_plans(user_id, start_date);
