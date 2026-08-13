CREATE TABLE `agent_channels` (
	`id` text PRIMARY KEY NOT NULL,
	`agent_id` text NOT NULL,
	`provider` text NOT NULL,
	`display_name` text NOT NULL,
	`config_json` text DEFAULT '{}' NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `agent_channels_agent_provider_name_idx` ON `agent_channels` (`agent_id`,`provider`,`display_name`);
--> statement-breakpoint
CREATE INDEX `agent_channels_agent_idx` ON `agent_channels` (`agent_id`);
--> statement-breakpoint
CREATE TABLE `agent_connections` (
	`id` text PRIMARY KEY NOT NULL,
	`agent_id` text NOT NULL,
	`provider` text NOT NULL,
	`display_name` text NOT NULL,
	`auth_type` text NOT NULL,
	`scopes` text,
	`config_json` text DEFAULT '{}' NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `agent_connections_agent_provider_name_idx` ON `agent_connections` (`agent_id`,`provider`,`display_name`);
--> statement-breakpoint
CREATE INDEX `agent_connections_agent_idx` ON `agent_connections` (`agent_id`);
--> statement-breakpoint
CREATE TABLE `agent_scheduled_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`agent_id` text NOT NULL,
	`name` text NOT NULL,
	`schedule` text NOT NULL,
	`prompt` text DEFAULT '' NOT NULL,
	`timezone` text DEFAULT 'UTC' NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`last_run_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `agent_scheduled_tasks_agent_name_idx` ON `agent_scheduled_tasks` (`agent_id`,`name`);
--> statement-breakpoint
CREATE INDEX `agent_scheduled_tasks_agent_idx` ON `agent_scheduled_tasks` (`agent_id`);
--> statement-breakpoint
CREATE TABLE `agent_workflow_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`agent_id` text NOT NULL,
	`name` text NOT NULL,
	`trigger` text NOT NULL,
	`steps_json` text DEFAULT '[]' NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `agent_workflow_tasks_agent_name_idx` ON `agent_workflow_tasks` (`agent_id`,`name`);
--> statement-breakpoint
CREATE INDEX `agent_workflow_tasks_agent_idx` ON `agent_workflow_tasks` (`agent_id`);
