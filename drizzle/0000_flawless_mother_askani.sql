CREATE TABLE `branch_visits` (
	`id` text PRIMARY KEY NOT NULL,
	`rep_id` text NOT NULL,
	`branch_id` text NOT NULL,
	`last_visit_date` text,
	`notes` text,
	`submitted_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`rep_id`) REFERENCES `representatives`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`branch_id`) REFERENCES `distribution_branches`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `idx_branch_visits_rep` ON `branch_visits` (`rep_id`);--> statement-breakpoint
CREATE INDEX `idx_branch_visits_branch` ON `branch_visits` (`branch_id`);--> statement-breakpoint
CREATE TABLE `distribution_branches` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`coverage_area` text NOT NULL,
	`contact` text,
	`phone` text,
	`distributed_products` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_dist_branches_name_area` ON `distribution_branches` (`name`,`coverage_area`);--> statement-breakpoint
CREATE TABLE `doctor_visits` (
	`id` text PRIMARY KEY NOT NULL,
	`rep_id` text NOT NULL,
	`doctor_id` text NOT NULL,
	`visit_date` text,
	`cycle_days` integer DEFAULT 0,
	`next_visit_date` text,
	`product_1` text,
	`product_2` text,
	`product_3` text,
	`reminder_product` text,
	`notes` text,
	`submitted_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`rep_id`) REFERENCES `representatives`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `idx_dr_visits_rep` ON `doctor_visits` (`rep_id`);--> statement-breakpoint
CREATE INDEX `idx_dr_visits_doctor` ON `doctor_visits` (`doctor_id`);--> statement-breakpoint
CREATE TABLE `doctors` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text,
	`name` text NOT NULL,
	`specialty` text,
	`workplace` text,
	`area` text NOT NULL,
	`mobile` text,
	`classification` text DEFAULT 'A' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_doctors_name_area` ON `doctors` (`name`,`area`);--> statement-breakpoint
CREATE TABLE `hospital_visits` (
	`id` text PRIMARY KEY NOT NULL,
	`rep_id` text NOT NULL,
	`hospital_id` text NOT NULL,
	`dept` text,
	`drs_visited` integer DEFAULT 0,
	`cycle_days` integer DEFAULT 0,
	`last_visit_date` text,
	`next_visit_date` text,
	`our_products` text,
	`competitor` text,
	`notes` text,
	`submitted_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`rep_id`) REFERENCES `representatives`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`hospital_id`) REFERENCES `hospitals`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `idx_hosp_visits_rep` ON `hospital_visits` (`rep_id`);--> statement-breakpoint
CREATE INDEX `idx_hosp_visits_hospital` ON `hospital_visits` (`hospital_id`);--> statement-breakpoint
CREATE INDEX `idx_hosp_visits_date` ON `hospital_visits` (`last_visit_date`);--> statement-breakpoint
CREATE TABLE `hospitals` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`area` text NOT NULL,
	`type` text DEFAULT 'Private' NOT NULL,
	`dept` text,
	`contact` text,
	`phone` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_hospitals_name_area` ON `hospitals` (`name`,`area`);--> statement-breakpoint
CREATE TABLE `login_attempts` (
	`ip_address` text PRIMARY KEY NOT NULL,
	`attempt_count` integer DEFAULT 1 NOT NULL,
	`last_attempt_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`locked_until` integer
);
--> statement-breakpoint
CREATE TABLE `pharmacies` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`area` text NOT NULL,
	`address` text,
	`pharmacist` text,
	`mobile` text,
	`classification` text DEFAULT 'A' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_pharmacies_name_area` ON `pharmacies` (`name`,`area`);--> statement-breakpoint
CREATE TABLE `pharmacy_visits` (
	`id` text PRIMARY KEY NOT NULL,
	`rep_id` text NOT NULL,
	`pharmacy_id` text NOT NULL,
	`cycle_days` integer DEFAULT 0,
	`last_visit_date` text,
	`next_visit_date` text,
	`our_products` text,
	`competitor` text,
	`notes` text,
	`submitted_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`rep_id`) REFERENCES `representatives`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`pharmacy_id`) REFERENCES `pharmacies`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `idx_pharm_visits_rep` ON `pharmacy_visits` (`rep_id`);--> statement-breakpoint
CREATE INDEX `idx_pharm_visits_pharmacy` ON `pharmacy_visits` (`pharmacy_id`);--> statement-breakpoint
CREATE TABLE `product_availabilities` (
	`id` text PRIMARY KEY NOT NULL,
	`rep_id` text NOT NULL,
	`hospital_id` text NOT NULL,
	`product_id` text NOT NULL,
	`month` text NOT NULL,
	`sales_units` integer DEFAULT 0 NOT NULL,
	`is_available` integer DEFAULT true NOT NULL,
	`notes` text,
	`submitted_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`rep_id`) REFERENCES `representatives`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`hospital_id`) REFERENCES `hospitals`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_prod_avail_unique` ON `product_availabilities` (`rep_id`,`hospital_id`,`product_id`,`month`);--> statement-breakpoint
CREATE INDEX `idx_prod_avail_rep` ON `product_availabilities` (`rep_id`);--> statement-breakpoint
CREATE INDEX `idx_prod_avail_month` ON `product_availabilities` (`month`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`code` text,
	`category` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_name_unique` ON `products` (`name`);--> statement-breakpoint
CREATE TABLE `representatives` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`area` text NOT NULL,
	`assigned_hospitals` integer DEFAULT 0 NOT NULL,
	`assigned_pharmacies` integer DEFAULT 0 NOT NULL,
	`assigned_drs` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `representatives_name_unique` ON `representatives` (`name`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_sessions_user` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_sessions_expires` ON `sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`name` text NOT NULL,
	`role` text DEFAULT 'REPRESENTATIVE' NOT NULL,
	`rep_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`rep_id`) REFERENCES `representatives`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);