CREATE TABLE `agents` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`created_by_user_id` text,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`instructions` text DEFAULT '' NOT NULL,
	`model` text DEFAULT '@cf/moonshotai/kimi-k2.6' NOT NULL,
	`max_steps` integer DEFAULT 250 NOT NULL,
	`chat_recovery` integer DEFAULT true NOT NULL,
	`extensions` integer DEFAULT true NOT NULL,
	`execution_config_json` text DEFAULT '{"workspaceTools":true,"execute":true,"executeBundle":true,"browser":true,"sandbox":true}' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`deployment_url` text,
	`latest_deployment_id` text,
	`last_run_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `agents_organization_slug_idx` ON `agents` (`organization_id`,`slug`);--> statement-breakpoint
CREATE INDEX `agents_organization_status_idx` ON `agents` (`organization_id`,`status`);--> statement-breakpoint
CREATE INDEX `agents_created_by_user_idx` ON `agents` (`created_by_user_id`);--> statement-breakpoint
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
CREATE UNIQUE INDEX `agent_channels_agent_provider_name_idx` ON `agent_channels` (`agent_id`,`provider`,`display_name`);--> statement-breakpoint
CREATE INDEX `agent_channels_agent_idx` ON `agent_channels` (`agent_id`);--> statement-breakpoint
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
CREATE UNIQUE INDEX `agent_connections_agent_provider_name_idx` ON `agent_connections` (`agent_id`,`provider`,`display_name`);--> statement-breakpoint
CREATE INDEX `agent_connections_agent_idx` ON `agent_connections` (`agent_id`);--> statement-breakpoint
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
CREATE INDEX `agent_dependencies_agent_idx` ON `agent_dependencies` (`agent_id`);--> statement-breakpoint
CREATE TABLE `agent_deployment_events` (
	`id` text PRIMARY KEY NOT NULL,
	`deployment_id` text NOT NULL,
	`level` text DEFAULT 'info' NOT NULL,
	`phase` text NOT NULL,
	`message` text NOT NULL,
	`metadata_json` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`deployment_id`) REFERENCES `agent_deployments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `agent_deployment_events_deployment_idx` ON `agent_deployment_events` (`deployment_id`);--> statement-breakpoint
CREATE INDEX `agent_deployment_events_level_idx` ON `agent_deployment_events` (`level`);--> statement-breakpoint
CREATE TABLE `agent_deployments` (
	`id` text PRIMARY KEY NOT NULL,
	`agent_id` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`worker_name` text NOT NULL,
	`worker_url` text,
	`trigger` text DEFAULT 'deploy' NOT NULL,
	`rollback_from_deployment_id` text,
	`wrangler_config_json` text,
	`manifest_json` text,
	`source_r2_key` text,
	`source_r2_version_id` text,
	`build_r2_key` text,
	`build_r2_version_id` text,
	`snapshot_manifest_r2_key` text,
	`snapshot_manifest_r2_version_id` text,
	`build_output_path` text,
	`error_message` text,
	`started_at` integer,
	`finished_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `agent_deployments_agent_idx` ON `agent_deployments` (`agent_id`);--> statement-breakpoint
CREATE INDEX `agent_deployments_status_idx` ON `agent_deployments` (`status`);--> statement-breakpoint
CREATE INDEX `agent_deployments_trigger_idx` ON `agent_deployments` (`trigger`);--> statement-breakpoint
CREATE INDEX `agent_deployments_rollback_from_idx` ON `agent_deployments` (`rollback_from_deployment_id`);--> statement-breakpoint
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
CREATE UNIQUE INDEX `agent_scheduled_tasks_agent_name_idx` ON `agent_scheduled_tasks` (`agent_id`,`name`);--> statement-breakpoint
CREATE INDEX `agent_scheduled_tasks_agent_idx` ON `agent_scheduled_tasks` (`agent_id`);--> statement-breakpoint
CREATE TABLE `agent_skill_resources` (
	`id` text PRIMARY KEY NOT NULL,
	`skill_id` text NOT NULL,
	`path` text NOT NULL,
	`kind` text NOT NULL,
	`mime_type` text,
	`size` integer DEFAULT 0 NOT NULL,
	`key` text NOT NULL,
	`precompiled` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`skill_id`) REFERENCES `agent_skills`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `agent_skill_resources_skill_path_idx` ON `agent_skill_resources` (`skill_id`,`path`);--> statement-breakpoint
CREATE INDEX `agent_skill_resources_skill_idx` ON `agent_skill_resources` (`skill_id`);--> statement-breakpoint
CREATE TABLE `agent_skills` (
	`id` text PRIMARY KEY NOT NULL,
	`agent_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`raw_content` text DEFAULT '' NOT NULL,
	`compatibility` text,
	`license` text,
	`allowed_tools` text,
	`metadata_json` text,
	`enabled` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `agent_skills_agent_name_idx` ON `agent_skills` (`agent_id`,`name`);--> statement-breakpoint
CREATE INDEX `agent_skills_agent_idx` ON `agent_skills` (`agent_id`);--> statement-breakpoint
CREATE TABLE `agent_subagent_tools` (
	`id` text PRIMARY KEY NOT NULL,
	`subagent_id` text NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`source_path` text,
	`config_path` text,
	`config_access` text,
	`description` text,
	`input_schema_json` text,
	`enabled` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`subagent_id`) REFERENCES `agent_subagents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `agent_subagent_tools_subagent_name_idx` ON `agent_subagent_tools` (`subagent_id`,`name`);--> statement-breakpoint
CREATE INDEX `agent_subagent_tools_subagent_idx` ON `agent_subagent_tools` (`subagent_id`);--> statement-breakpoint
CREATE TABLE `agent_subagents` (
	`id` text PRIMARY KEY NOT NULL,
	`agent_id` text NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`instructions` text DEFAULT '' NOT NULL,
	`model` text DEFAULT '@cf/moonshotai/kimi-k2.6' NOT NULL,
	`max_steps` integer DEFAULT 250 NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `agent_subagents_agent_slug_idx` ON `agent_subagents` (`agent_id`,`slug`);--> statement-breakpoint
CREATE INDEX `agent_subagents_agent_idx` ON `agent_subagents` (`agent_id`);--> statement-breakpoint
CREATE TABLE `agent_tools` (
	`id` text PRIMARY KEY NOT NULL,
	`agent_id` text NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`source_path` text,
	`config_path` text,
	`config_access` text,
	`description` text,
	`input_schema_json` text,
	`enabled` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `agent_tools_agent_name_idx` ON `agent_tools` (`agent_id`,`name`);--> statement-breakpoint
CREATE INDEX `agent_tools_agent_idx` ON `agent_tools` (`agent_id`);--> statement-breakpoint
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
CREATE UNIQUE INDEX `agent_workflow_tasks_agent_name_idx` ON `agent_workflow_tasks` (`agent_id`,`name`);--> statement-breakpoint
CREATE INDEX `agent_workflow_tasks_agent_idx` ON `agent_workflow_tasks` (`agent_id`);--> statement-breakpoint
CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `accounts_userId_idx` ON `accounts` (`user_id`);--> statement-breakpoint
CREATE TABLE `invitations` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`email` text NOT NULL,
	`role` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`inviter_id` text NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`inviter_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `invitations_organizationId_idx` ON `invitations` (`organization_id`);--> statement-breakpoint
CREATE INDEX `invitations_email_idx` ON `invitations` (`email`);--> statement-breakpoint
CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `members_organizationId_idx` ON `members` (`organization_id`);--> statement-breakpoint
CREATE INDEX `members_userId_idx` ON `members` (`user_id`);--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`logo` text,
	`created_at` integer NOT NULL,
	`metadata` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `organizations_slug_unique` ON `organizations` (`slug`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	`timezone` text,
	`city` text,
	`country` text,
	`region` text,
	`region_code` text,
	`colo` text,
	`latitude` text,
	`longitude` text,
	`active_organization_id` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);--> statement-breakpoint
CREATE INDEX `sessions_userId_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `verifications` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verifications_identifier_idx` ON `verifications` (`identifier`);