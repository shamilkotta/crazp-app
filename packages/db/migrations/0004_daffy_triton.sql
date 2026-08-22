CREATE TABLE `agent_dependencies` (
	`id` text PRIMARY KEY NOT NULL,
	`agent_id` text NOT NULL,
	`name` text NOT NULL,
	`version` text NOT NULL,
	`kind` text DEFAULT 'dependency' NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `agent_dependencies_agent_name_idx` ON `agent_dependencies` (`agent_id`,`name`);--> statement-breakpoint
CREATE INDEX `agent_dependencies_agent_idx` ON `agent_dependencies` (`agent_id`);