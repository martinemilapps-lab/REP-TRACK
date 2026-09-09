-- REP TRACK Admin Phase 1: immutable security audit foundation.
-- Prepared for D1; do not execute without explicit human approval.
CREATE TABLE IF NOT EXISTS `admin_audit_events` (
  `id` text PRIMARY KEY NOT NULL,
  `admin_user_id` text NOT NULL,
  `action_type` text NOT NULL,
  `target_type` text NOT NULL,
  `target_id` text NOT NULL,
  `metadata` text DEFAULT '{}' NOT NULL,
  `created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
  FOREIGN KEY (`admin_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
CREATE INDEX IF NOT EXISTS `idx_admin_audit_created` ON `admin_audit_events` (`created_at`);
CREATE INDEX IF NOT EXISTS `idx_admin_audit_admin` ON `admin_audit_events` (`admin_user_id`);
CREATE INDEX IF NOT EXISTS `idx_admin_audit_target` ON `admin_audit_events` (`target_type`, `target_id`);
CREATE INDEX IF NOT EXISTS `idx_admin_audit_action` ON `admin_audit_events` (`action_type`);
CREATE TRIGGER IF NOT EXISTS `trg_admin_audit_no_update`
BEFORE UPDATE ON `admin_audit_events`
BEGIN SELECT RAISE(ABORT, 'admin audit events are immutable'); END;
CREATE TRIGGER IF NOT EXISTS `trg_admin_audit_no_delete`
BEFORE DELETE ON `admin_audit_events`
BEGIN SELECT RAISE(ABORT, 'admin audit events are immutable'); END;
