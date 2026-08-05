import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

import { organizations, users } from "./auth.schema";

const timestamp = (name: string) =>
  integer(name, { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull();

const updatedTimestamp = (name: string) =>
  integer(name, { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull();

export type AgentDeploymentManifest = {
  agent: Record<string, unknown>;
  tools?: Record<string, unknown>[];
  subagents?: Array<
    Record<string, unknown> & {
      tools?: Record<string, unknown>[];
    }
  >;
  skills?: Array<
    Record<string, unknown> & {
      resources?: Record<string, unknown>[];
    }
  >;
};

export const agents = sqliteTable(
  "agents",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    createdByUserId: text("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    instructions: text("instructions").notNull().default(""),
    model: text("model").notNull().default("@cf/moonshotai/kimi-k2.6"),
    maxSteps: integer("max_steps").notNull().default(250),
    chatRecovery: integer("chat_recovery", { mode: "boolean" })
      .notNull()
      .default(true),
    extensions: integer("extensions", { mode: "boolean" })
      .notNull()
      .default(true),
    executionConfigJson: text("execution_config_json", { mode: "json" })
      .$type<{
        workspaceTools?: boolean;
        execute?: boolean;
        executeBundle?: boolean;
        browser?: boolean;
        sandbox?: boolean;
      }>()
      .notNull()
      .default({
        workspaceTools: true,
        execute: true,
        executeBundle: true,
        browser: true,
        sandbox: true,
      }),
    status: text("status", {
      enum: ["draft", "deploying", "active", "paused", "error", "archived"],
    })
      .notNull()
      .default("draft"),
    workerName: text("worker_name"),
    deploymentUrl: text("deployment_url"),
    latestDeploymentId: text("latest_deployment_id"),
    lastRunAt: integer("last_run_at", { mode: "timestamp_ms" }),
    createdAt: timestamp("created_at"),
    updatedAt: updatedTimestamp("updated_at"),
  },
  (table) => [
    uniqueIndex("agents_organization_slug_idx").on(
      table.organizationId,
      table.slug
    ),
    index("agents_organization_status_idx").on(
      table.organizationId,
      table.status
    ),
    index("agents_created_by_user_idx").on(table.createdByUserId),
  ]
);

export const agentTools = sqliteTable(
  "agent_tools",
  {
    id: text("id").primaryKey(),
    agentId: text("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    kind: text("kind", {
      enum: ["file", "inline", "builtin", "external"],
    }).notNull(),
    sourcePath: text("source_path"),
    configPath: text("config_path"),
    configAccess: text("config_access"),
    description: text("description"),
    inputSchemaJson: text("input_schema_json", { mode: "json" }).$type<
      Record<string, unknown>
    >(),
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
    createdAt: timestamp("created_at"),
    updatedAt: updatedTimestamp("updated_at"),
  },
  (table) => [
    uniqueIndex("agent_tools_agent_name_idx").on(table.agentId, table.name),
    index("agent_tools_agent_idx").on(table.agentId),
  ]
);

export const agentSubagents = sqliteTable(
  "agent_subagents",
  {
    id: text("id").primaryKey(),
    agentId: text("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    displayName: text("display_name").notNull(),
    description: text("description").notNull().default(""),
    instructions: text("instructions").notNull().default(""),
    model: text("model").notNull().default("@cf/moonshotai/kimi-k2.6"),
    maxSteps: integer("max_steps").notNull().default(250),
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
    createdAt: timestamp("created_at"),
    updatedAt: updatedTimestamp("updated_at"),
  },
  (table) => [
    uniqueIndex("agent_subagents_agent_key_idx").on(table.agentId, table.key),
    index("agent_subagents_agent_idx").on(table.agentId),
  ]
);

export const agentSubagentTools = sqliteTable(
  "agent_subagent_tools",
  {
    id: text("id").primaryKey(),
    subagentId: text("subagent_id")
      .notNull()
      .references(() => agentSubagents.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    kind: text("kind", {
      enum: ["file", "inline", "builtin", "external"],
    }).notNull(),
    sourcePath: text("source_path"),
    configPath: text("config_path"),
    configAccess: text("config_access"),
    description: text("description"),
    inputSchemaJson: text("input_schema_json", { mode: "json" }).$type<
      Record<string, unknown>
    >(),
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
    createdAt: timestamp("created_at"),
    updatedAt: updatedTimestamp("updated_at"),
  },
  (table) => [
    uniqueIndex("agent_subagent_tools_subagent_name_idx").on(
      table.subagentId,
      table.name
    ),
    index("agent_subagent_tools_subagent_idx").on(table.subagentId),
  ]
);

export const agentSkills = sqliteTable(
  "agent_skills",
  {
    id: text("id").primaryKey(),
    agentId: text("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    body: text("body").notNull().default(""),
    rawContent: text("raw_content").notNull().default(""),
    compatibility: text("compatibility"),
    license: text("license"),
    allowedTools: text("allowed_tools"),
    metadataJson: text("metadata_json", { mode: "json" }).$type<
      Record<string, unknown>
    >(),
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
    createdAt: timestamp("created_at"),
    updatedAt: updatedTimestamp("updated_at"),
  },
  (table) => [
    uniqueIndex("agent_skills_agent_name_idx").on(table.agentId, table.name),
    index("agent_skills_agent_idx").on(table.agentId),
  ]
);

export const agentSkillResources = sqliteTable(
  "agent_skill_resources",
  {
    id: text("id").primaryKey(),
    skillId: text("skill_id")
      .notNull()
      .references(() => agentSkills.id, { onDelete: "cascade" }),
    path: text("path").notNull(),
    kind: text("kind", {
      enum: ["reference", "script", "asset", "file"],
    }).notNull(),
    encoding: text("encoding", { enum: ["text", "base64"] }).notNull(),
    mimeType: text("mime_type"),
    size: integer("size").notNull().default(0),
    content: text("content").notNull().default(""),
    precompiled: integer("precompiled", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: timestamp("created_at"),
    updatedAt: updatedTimestamp("updated_at"),
  },
  (table) => [
    uniqueIndex("agent_skill_resources_skill_path_idx").on(
      table.skillId,
      table.path
    ),
    index("agent_skill_resources_skill_idx").on(table.skillId),
  ]
);

export const agentDeployments = sqliteTable(
  "agent_deployments",
  {
    id: text("id").primaryKey(),
    agentId: text("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    status: text("status", {
      enum: [
        "queued",
        "scaffolding",
        "building",
        "deploying",
        "active",
        "error",
        "cancelled",
      ],
    })
      .notNull()
      .default("queued"),
    workerName: text("worker_name").notNull(),
    workerUrl: text("worker_url"),
    cloudflareAccountId: text("cloudflare_account_id"),
    trigger: text("trigger", { enum: ["deploy", "rollback"] })
      .notNull()
      .default("deploy"),
    rollbackFromDeploymentId: text("rollback_from_deployment_id"),
    wranglerConfigJson: text("wrangler_config_json", {
      mode: "json",
    }).$type<Record<string, unknown>>(),
    manifestJson: text("manifest_json", {
      mode: "json",
    }).$type<AgentDeploymentManifest>(),
    sourceR2Key: text("source_r2_key"),
    sourceR2VersionId: text("source_r2_version_id"),
    buildR2Key: text("build_r2_key"),
    buildR2VersionId: text("build_r2_version_id"),
    snapshotManifestR2Key: text("snapshot_manifest_r2_key"),
    snapshotManifestR2VersionId: text("snapshot_manifest_r2_version_id"),
    buildOutputPath: text("build_output_path"),
    errorMessage: text("error_message"),
    startedAt: integer("started_at", { mode: "timestamp_ms" }),
    finishedAt: integer("finished_at", { mode: "timestamp_ms" }),
    createdAt: timestamp("created_at"),
    updatedAt: updatedTimestamp("updated_at"),
  },
  (table) => [
    index("agent_deployments_agent_idx").on(table.agentId),
    index("agent_deployments_status_idx").on(table.status),
    index("agent_deployments_trigger_idx").on(table.trigger),
    index("agent_deployments_rollback_from_idx").on(
      table.rollbackFromDeploymentId
    ),
  ]
);

export const agentDeploymentEvents = sqliteTable(
  "agent_deployment_events",
  {
    id: text("id").primaryKey(),
    deploymentId: text("deployment_id")
      .notNull()
      .references(() => agentDeployments.id, { onDelete: "cascade" }),
    level: text("level", { enum: ["info", "warn", "error"] })
      .notNull()
      .default("info"),
    phase: text("phase").notNull(),
    message: text("message").notNull(),
    metadataJson: text("metadata_json", { mode: "json" }).$type<
      Record<string, unknown>
    >(),
    createdAt: timestamp("created_at"),
  },
  (table) => [
    index("agent_deployment_events_deployment_idx").on(table.deploymentId),
    index("agent_deployment_events_level_idx").on(table.level),
  ]
);

export const agentsRelations = relations(agents, ({ many, one }) => ({
  organization: one(organizations, {
    fields: [agents.organizationId],
    references: [organizations.id],
  }),
  createdBy: one(users, {
    fields: [agents.createdByUserId],
    references: [users.id],
  }),
  tools: many(agentTools),
  subagents: many(agentSubagents),
  skills: many(agentSkills),
  deployments: many(agentDeployments),
}));

export const agentToolsRelations = relations(agentTools, ({ one }) => ({
  agent: one(agents, {
    fields: [agentTools.agentId],
    references: [agents.id],
  }),
}));

export const agentSubagentsRelations = relations(
  agentSubagents,
  ({ many, one }) => ({
    agent: one(agents, {
      fields: [agentSubagents.agentId],
      references: [agents.id],
    }),
    tools: many(agentSubagentTools),
  })
);

export const agentSubagentToolsRelations = relations(
  agentSubagentTools,
  ({ one }) => ({
    subagent: one(agentSubagents, {
      fields: [agentSubagentTools.subagentId],
      references: [agentSubagents.id],
    }),
  })
);

export const agentSkillsRelations = relations(agentSkills, ({ many, one }) => ({
  agent: one(agents, {
    fields: [agentSkills.agentId],
    references: [agents.id],
  }),
  resources: many(agentSkillResources),
}));

export const agentSkillResourcesRelations = relations(
  agentSkillResources,
  ({ one }) => ({
    skill: one(agentSkills, {
      fields: [agentSkillResources.skillId],
      references: [agentSkills.id],
    }),
  })
);

export const agentDeploymentsRelations = relations(
  agentDeployments,
  ({ many, one }) => ({
    agent: one(agents, {
      fields: [agentDeployments.agentId],
      references: [agents.id],
    }),
    events: many(agentDeploymentEvents),
  })
);

export const agentDeploymentEventsRelations = relations(
  agentDeploymentEvents,
  ({ one }) => ({
    deployment: one(agentDeployments, {
      fields: [agentDeploymentEvents.deploymentId],
      references: [agentDeployments.id],
    }),
  })
);

export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;
export type AgentTool = typeof agentTools.$inferSelect;
export type NewAgentTool = typeof agentTools.$inferInsert;
export type AgentSubagent = typeof agentSubagents.$inferSelect;
export type NewAgentSubagent = typeof agentSubagents.$inferInsert;
export type AgentSubagentTool = typeof agentSubagentTools.$inferSelect;
export type NewAgentSubagentTool = typeof agentSubagentTools.$inferInsert;
export type AgentSkill = typeof agentSkills.$inferSelect;
export type NewAgentSkill = typeof agentSkills.$inferInsert;
export type AgentSkillResource = typeof agentSkillResources.$inferSelect;
export type NewAgentSkillResource = typeof agentSkillResources.$inferInsert;
export type AgentDeployment = typeof agentDeployments.$inferSelect;
export type NewAgentDeployment = typeof agentDeployments.$inferInsert;
export type AgentDeploymentEvent = typeof agentDeploymentEvents.$inferSelect;
export type NewAgentDeploymentEvent = typeof agentDeploymentEvents.$inferInsert;
