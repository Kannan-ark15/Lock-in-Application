CREATE TABLE `daily_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`task_ids` text NOT NULL,
	`completed_task_ids` text DEFAULT '[]' NOT NULL,
	`completion_pct` real DEFAULT 0 NOT NULL,
	`wallpaper_id` text NOT NULL,
	`rendered_wallpaper_uri` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `daily_logs_date_unique` ON `daily_logs` (`date`);--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`icon` text NOT NULL,
	`priority` text NOT NULL,
	`is_recurring` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`archived_at` text
);
--> statement-breakpoint
CREATE TABLE `user_profile` (
	`id` text PRIMARY KEY DEFAULT 'singleton' NOT NULL,
	`streak_count` integer DEFAULT 0 NOT NULL,
	`longest_streak` integer DEFAULT 0 NOT NULL,
	`last_full_completion_date` text,
	`unlocked_wallpaper_ids` text DEFAULT '[]' NOT NULL,
	`preferred_reveal_mode` text DEFAULT 'radial' NOT NULL,
	`sound_enabled` integer DEFAULT true NOT NULL,
	`haptic_enabled` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `wallpapers` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`source_uri` text NOT NULL,
	`theme` text NOT NULL,
	`reveal_mode` text DEFAULT 'radial' NOT NULL,
	`is_unlocked` integer DEFAULT false NOT NULL,
	`unlock_condition` text
);
