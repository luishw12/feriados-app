CREATE TABLE `holiday_overrides` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`holiday_id` text NOT NULL,
	`year` integer NOT NULL,
	`date` text,
	`note` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`holiday_id`) REFERENCES `holidays`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `holiday_overrides_holiday_year` ON `holiday_overrides` (`holiday_id`,`year`);--> statement-breakpoint
CREATE TABLE `holidays` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`scope` text NOT NULL,
	`uf` text,
	`ibge` integer,
	`kind` text NOT NULL,
	`rule` text NOT NULL,
	`valid_from` integer,
	`valid_to` integer,
	`categories` text DEFAULT '[]' NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`legal_basis` text DEFAULT '' NOT NULL,
	`source_url` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'unverified' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`uf`) REFERENCES `states`(`uf`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ibge`) REFERENCES `municipalities`(`ibge`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `holidays_scope` ON `holidays` (`scope`);--> statement-breakpoint
CREATE INDEX `holidays_uf` ON `holidays` (`uf`);--> statement-breakpoint
CREATE INDEX `holidays_ibge` ON `holidays` (`ibge`);--> statement-breakpoint
CREATE TABLE `municipalities` (
	`ibge` integer PRIMARY KEY NOT NULL,
	`uf` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`capital` integer DEFAULT false NOT NULL,
	`lat` real,
	`lng` real,
	FOREIGN KEY (`uf`) REFERENCES `states`(`uf`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `municipalities_uf_slug` ON `municipalities` (`uf`,`slug`);--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`window_start` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `redirects` (
	`from_path` text PRIMARY KEY NOT NULL,
	`to_path` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `revisions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`holiday_id` text NOT NULL,
	`action` text NOT NULL,
	`before` text,
	`after` text,
	`suggestion_id` text,
	`author` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`suggestion_id`) REFERENCES `suggestions`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `revisions_holiday` ON `revisions` (`holiday_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`login` text NOT NULL,
	`name` text NOT NULL,
	`avatar_url` text DEFAULT '' NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `states` (
	`uf` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`region` text NOT NULL,
	`capital_ibge` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `states_slug_unique` ON `states` (`slug`);--> statement-breakpoint
CREATE TABLE `suggestions` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`holiday_id` text,
	`uf` text,
	`ibge` integer,
	`payload` text NOT NULL,
	`snapshot` text,
	`message` text DEFAULT '' NOT NULL,
	`source_url` text DEFAULT '' NOT NULL,
	`contributor_name` text,
	`contributor_link` text,
	`contributor_email` text,
	`ip_hash` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`review_note` text DEFAULT '' NOT NULL,
	`reviewed_by` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`reviewed_at` integer,
	FOREIGN KEY (`holiday_id`) REFERENCES `holidays`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `suggestions_status` ON `suggestions` (`status`,`created_at`);