-- D1 Organization Schema Extension
CREATE TABLE IF NOT EXISTS `positions` (
  `code` TEXT PRIMARY KEY NOT NULL,
  `title_en` TEXT NOT NULL,
  `title_ar` TEXT NOT NULL,
  `hierarchy_level` INTEGER NOT NULL
);

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

CREATE TABLE IF NOT EXISTS `manager_rep_scopes` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `manager_user_id` TEXT NOT NULL,
  `rep_id` TEXT NOT NULL,
  `created_at` INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  FOREIGN KEY (`manager_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`rep_id`) REFERENCES `representatives`(`id`) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS `idx_mgr_rep_scopes_unique` ON `manager_rep_scopes` (`manager_user_id`, `rep_id`);
CREATE INDEX IF NOT EXISTS `idx_mgr_rep_scopes_mgr` ON `manager_rep_scopes` (`manager_user_id`);
CREATE INDEX IF NOT EXISTS `idx_mgr_rep_scopes_rep` ON `manager_rep_scopes` (`rep_id`);

CREATE TABLE IF NOT EXISTS `manager_area_scopes` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `manager_user_id` TEXT NOT NULL,
  `area_id` TEXT NOT NULL,
  `created_at` INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  FOREIGN KEY (`manager_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`area_id`) REFERENCES `areas`(`id`) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS `idx_mgr_area_scopes_unique` ON `manager_area_scopes` (`manager_user_id`, `area_id`);
CREATE INDEX IF NOT EXISTS `idx_mgr_area_scopes_mgr` ON `manager_area_scopes` (`manager_user_id`);
CREATE INDEX IF NOT EXISTS `idx_mgr_area_scopes_area` ON `manager_area_scopes` (`area_id`);

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

CREATE UNIQUE INDEX IF NOT EXISTS `idx_users_pos_num` ON `users` (`position_code`, `username_number`);
CREATE INDEX IF NOT EXISTS `idx_users_position` ON `users` (`position_code`);
CREATE INDEX IF NOT EXISTS `idx_users_is_active` ON `users` (`is_active`);
CREATE UNIQUE INDEX IF NOT EXISTS `idx_representatives_name` ON `representatives` (`name`);
