ALTER TABLE `agent_skill_resources` ADD `key` text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE `agent_skill_resources` DROP COLUMN `encoding`;
--> statement-breakpoint
ALTER TABLE `agent_skill_resources` DROP COLUMN `content`;
