CREATE TABLE `weekly_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`rep_id` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`week_label` text,
	`saturday_am` text DEFAULT '',
	`saturday_pm` text DEFAULT '',
	`sunday_am` text DEFAULT '',
	`sunday_pm` text DEFAULT '',
	`monday_am` text DEFAULT '',
	`monday_pm` text DEFAULT '',
	`tuesday_am` text DEFAULT '',
	`tuesday_pm` text DEFAULT '',
	`wednesday_am` text DEFAULT '',
	`wednesday_pm` text DEFAULT '',
	`thursday_am` text DEFAULT '',
	`thursday_pm` text DEFAULT '',
	`friday_am` text DEFAULT '',
	`friday_pm` text DEFAULT '',
	`status` text DEFAULT 'Submitted' NOT NULL,
	`manager_notes` text,
	`submitted_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`rep_id`) REFERENCES `representatives`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_weekly_plans_rep` ON `weekly_plans` (`rep_id`);--> statement-breakpoint
CREATE INDEX `idx_weekly_plans_dates` ON `weekly_plans` (`start_date`,`end_date`);--> statement-breakpoint
ALTER TABLE `branch_visits` ADD `visit_type` text DEFAULT 'Single' NOT NULL;--> statement-breakpoint
ALTER TABLE `branch_visits` ADD `companion` text;--> statement-breakpoint
ALTER TABLE `doctor_visits` ADD `visit_type` text DEFAULT 'Single' NOT NULL;--> statement-breakpoint
ALTER TABLE `doctor_visits` ADD `companion` text;--> statement-breakpoint
ALTER TABLE `hospital_visits` ADD `visit_type` text DEFAULT 'Single' NOT NULL;--> statement-breakpoint
ALTER TABLE `hospital_visits` ADD `companion` text;--> statement-breakpoint
ALTER TABLE `pharmacy_visits` ADD `visit_type` text DEFAULT 'Single' NOT NULL;--> statement-breakpoint
ALTER TABLE `pharmacy_visits` ADD `companion` text;