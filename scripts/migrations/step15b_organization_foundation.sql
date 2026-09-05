-- ==============================================================================
-- REP TRACK: STEP 15B Schema Migration
-- Foundation: General Organization Model, Dual-Role Sales Assignments & Hierarchy
-- Database Target: rep-track-dev (Cloudflare D1)
-- Safety: Non-destructive additions. Preserves all existing business and visit data.
-- ==============================================================================

-- 1. POSITIONS LOOKUP TABLE
CREATE TABLE IF NOT EXISTS `positions` (
  `code` TEXT PRIMARY KEY NOT NULL,
  `title_en` TEXT NOT NULL,
  `title_ar` TEXT NOT NULL,
  `hierarchy_level` INTEGER NOT NULL
);

-- 2. AREAS (TERRITORY) MASTER TABLE
CREATE TABLE IF NOT EXISTS `areas` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `name` TEXT NOT NULL,
  `region` TEXT,
  `is_active` INTEGER NOT NULL DEFAULT 1,
  `created_at` INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  `updated_at` INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE UNIQUE INDEX IF NOT EXISTS `idx_areas_name` ON `areas` (`name`);
CREATE INDEX IF NOT EXISTS `idx_areas_active` ON `areas` (`is_active`);

-- 3. VISIT OBJECTIVES (48 Bilingual Objectives across 8 Positions)
CREATE TABLE IF NOT EXISTS `visit_objectives` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `position_code` TEXT NOT NULL CHECK (`position_code` IN ('MR', 'DM', 'AM', 'OM', 'BUM', 'PM', 'MM', 'SMD')),
  `objective_code` TEXT NOT NULL,
  `name_ar` TEXT NOT NULL,
  `name_en` TEXT NOT NULL,
  `display_order` INTEGER NOT NULL DEFAULT 0,
  `is_active` INTEGER NOT NULL DEFAULT 1,
  `created_at` INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  `updated_at` INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE UNIQUE INDEX IF NOT EXISTS `idx_visit_obj_unique` ON `visit_objectives` (`position_code`, `objective_code`);
CREATE INDEX IF NOT EXISTS `idx_visit_obj_position` ON `visit_objectives` (`position_code`);
CREATE INDEX IF NOT EXISTS `idx_visit_obj_active` ON `visit_objectives` (`is_active`);

-- 4. EXTEND USERS TABLE (Idempotent column additions)
-- SQLite doesn't have IF NOT EXISTS for ADD COLUMN, but in D1 these will apply safely if not present
-- In STEP 11, these columns were added to D1; this ensures schema completeness:
-- ALTER TABLE `users` ADD COLUMN `position_code` TEXT REFERENCES `positions`(`code`);
-- ALTER TABLE `users` ADD COLUMN `system_role` TEXT DEFAULT 'USER';
-- ALTER TABLE `users` ADD COLUMN `legacy_title_raw` TEXT;
-- ALTER TABLE `users` ADD COLUMN `business_line` INTEGER;
-- ALTER TABLE `users` ADD COLUMN `username_number` INTEGER DEFAULT 1;
-- ALTER TABLE `users` ADD COLUMN `must_change_password` INTEGER DEFAULT 0;
-- ALTER TABLE `users` ADD COLUMN `is_active` INTEGER DEFAULT 1;

-- 5. SALES ASSIGNMENTS (Decoupling User Accounts from Territory Lines & Supporting Dual-Roles)
CREATE TABLE IF NOT EXISTS `sales_assignments` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `user_id` TEXT NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE,
  `assignment_type` TEXT NOT NULL CHECK (`assignment_type` IN ('PRIMARY_REP', 'PERSONAL_MR', 'TERRITORY_COVERAGE')),
  `title_raw` TEXT NOT NULL,
  `business_line` INTEGER,
  `area_id` TEXT REFERENCES `areas`(`id`) ON DELETE SET NULL,
  `territory_name` TEXT NOT NULL,
  `rep_id` TEXT REFERENCES `representatives`(`id`) ON DELETE SET NULL,
  `source_row` INTEGER,
  `is_active` INTEGER NOT NULL DEFAULT 1,
  `created_at` INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  `updated_at` INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX IF NOT EXISTS `idx_sales_assign_user` ON `sales_assignments` (`user_id`);
CREATE INDEX IF NOT EXISTS `idx_sales_assign_area` ON `sales_assignments` (`area_id`);
CREATE INDEX IF NOT EXISTS `idx_sales_assign_line` ON `sales_assignments` (`business_line`);
CREATE INDEX IF NOT EXISTS `idx_sales_assign_type` ON `sales_assignments` (`assignment_type`);

-- 6. GENERAL ORGANIZATION RELATIONSHIPS (Direct Hierarchy Edges)
CREATE TABLE IF NOT EXISTS `organization_relationships` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `subordinate_user_id` TEXT NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE,
  `manager_user_id` TEXT NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE,
  `relationship_type` TEXT NOT NULL DEFAULT 'DIRECT' CHECK (`relationship_type` IN ('DIRECT', 'MULTI_BUM', 'FUNCTIONAL', 'SKIP_LEVEL')),
  `source_position` TEXT NOT NULL,
  `manager_position` TEXT NOT NULL,
  `subordinate_assignment_id` TEXT REFERENCES `sales_assignments`(`id`) ON DELETE SET NULL,
  `is_active` INTEGER NOT NULL DEFAULT 1,
  `source_metadata` TEXT,
  `created_at` INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE UNIQUE INDEX IF NOT EXISTS `idx_org_rel_unique` ON `organization_relationships` (`subordinate_user_id`, `manager_user_id`, `relationship_type`);
CREATE INDEX IF NOT EXISTS `idx_org_rel_mgr_sub` ON `organization_relationships` (`manager_user_id`, `subordinate_user_id`);
CREATE INDEX IF NOT EXISTS `idx_org_rel_sub` ON `organization_relationships` (`subordinate_user_id`);

-- 7. HIERARCHY PATHS (Materialized Transitive Closure for O(1) Routing)
CREATE TABLE IF NOT EXISTS `hierarchy_paths` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `source_assignment_id` TEXT REFERENCES `sales_assignments`(`id`) ON DELETE CASCADE,
  `source_user_id` TEXT NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE,
  `ancestor_user_id` TEXT NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE,
  `ancestor_position` TEXT NOT NULL,
  `depth` INTEGER NOT NULL DEFAULT 1,
  `created_at` INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE UNIQUE INDEX IF NOT EXISTS `idx_hier_unique_path` ON `hierarchy_paths` (`ancestor_user_id`, `source_assignment_id`, `source_user_id`);
CREATE INDEX IF NOT EXISTS `idx_hier_ancestor` ON `hierarchy_paths` (`ancestor_user_id`);
CREATE INDEX IF NOT EXISTS `idx_hier_source_assign` ON `hierarchy_paths` (`source_assignment_id`);

-- 8. BACKWARD COMPATIBILITY: MANAGER SCOPES
CREATE TABLE IF NOT EXISTS `manager_rep_scopes` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `manager_user_id` TEXT NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE,
  `rep_id` TEXT NOT NULL REFERENCES `representatives`(`id`) ON DELETE CASCADE,
  `created_at` INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE UNIQUE INDEX IF NOT EXISTS `idx_mgr_rep_scopes_unique` ON `manager_rep_scopes` (`manager_user_id`, `rep_id`);
CREATE INDEX IF NOT EXISTS `idx_mgr_rep_scopes_mgr` ON `manager_rep_scopes` (`manager_user_id`);
CREATE INDEX IF NOT EXISTS `idx_mgr_rep_scopes_rep` ON `manager_rep_scopes` (`rep_id`);

CREATE TABLE IF NOT EXISTS `manager_area_scopes` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `manager_user_id` TEXT NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE,
  `area_id` TEXT NOT NULL REFERENCES `areas`(`id`) ON DELETE CASCADE,
  `created_at` INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE UNIQUE INDEX IF NOT EXISTS `idx_mgr_area_scopes_unique` ON `manager_area_scopes` (`manager_user_id`, `area_id`);
CREATE INDEX IF NOT EXISTS `idx_mgr_area_scopes_mgr` ON `manager_area_scopes` (`manager_user_id`);
CREATE INDEX IF NOT EXISTS `idx_mgr_area_scopes_area` ON `manager_area_scopes` (`area_id`);
