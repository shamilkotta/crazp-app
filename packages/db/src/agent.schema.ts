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
  dependencies?: Array<{
    name: string;
    version: string;
    kind: "dependency" | "devDependency";
  }>;
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
        container?: boolean;
        browser?: boolean;
      }>()
      .notNull()
      .default({
        workspaceTools: true,
        container: true,
        browser: true,
      }),
    status: text("status", {
      enum: ["draft", "deploying", "active", "paused", "error", "archived"],
    })
      .notNull()
      .default("draft"),
    deploymentUrl: text("deployment_url"),
    latestDeploymentId: text("latest_deployment_id"),
    lastRunAt: integer("last_run_at", { mode: "timestamp_ms" }),
    createdAt: timestamp("created_at"),
    updatedAt: updatedTimestamp("updated_at"),
  },
  (table) => [
    uniqueIndex("agents_slug_idx").on(table.slug),
    index("agents_organization_status_idx").on(
      table.organizationId,
      table.status
    ),
    index("agents_created_by_user_idx").on(table.createdByUserId),
  ]
);

export const dependencies = sqliteTable(
  "agent_dependencies",
  {
    id: text("id").primaryKey(),
    agentId: text("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    version: text("version").notNull(),
    kind: text("kind", {
      enum: ["dependency", "devDependency"],
    })
      .notNull()
      .default("dependency"),
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
    createdAt: timestamp("created_at"),
    updatedAt: updatedTimestamp("updated_at"),
  },
  (table) => [
    uniqueIndex("agent_dependencies_agent_name_idx").on(
      table.agentId,
      table.name
    ),
    index("agent_dependencies_agent_idx").on(table.agentId),
  ]
);

export const tools = sqliteTable(
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

export const subagents = sqliteTable(
  "agent_subagents",
  {
    id: text("id").primaryKey(),
    agentId: text("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    instructions: text("instructions").notNull().default(""),
    model: text("model").notNull().default("@cf/moonshotai/kimi-k2.6"),
    maxSteps: integer("max_steps").notNull().default(250),
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
    createdAt: timestamp("created_at"),
    updatedAt: updatedTimestamp("updated_at"),
  },
  (table) => [
    uniqueIndex("agent_subagents_agent_slug_idx").on(table.agentId, table.slug),
    index("agent_subagents_agent_idx").on(table.agentId),
  ]
);

export const subagentTools = sqliteTable(
  "agent_subagent_tools",
  {
    id: text("id").primaryKey(),
    subagentId: text("subagent_id")
      .notNull()
      .references(() => subagents.id, { onDelete: "cascade" }),
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

export const skills = sqliteTable(
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

export const skillResources = sqliteTable(
  "agent_skill_resources",
  {
    id: text("id").primaryKey(),
    skillId: text("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    path: text("path").notNull(),
    kind: text("kind", {
      enum: ["reference", "script", "asset", "file"],
    }).notNull(),
    mimeType: text("mime_type"),
    size: integer("size").notNull().default(0),
    key: text("key").notNull(),
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

export const channels = sqliteTable(
  "agent_channels",
  {
    id: text("id").primaryKey(),
    agentId: text("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    provider: text("provider", {
      enum: ["slack", "whatsapp", "telegram", "discord", "web", "email"],
    }).notNull(),
    displayName: text("display_name").notNull(),
    configJson: text("config_json", { mode: "json" })
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
    createdAt: timestamp("created_at"),
    updatedAt: updatedTimestamp("updated_at"),
  },
  (table) => [
    uniqueIndex("agent_channels_agent_provider_name_idx").on(
      table.agentId,
      table.provider,
      table.displayName
    ),
    index("agent_channels_agent_idx").on(table.agentId),
  ]
);

export const connections = sqliteTable(
  "agent_connections",
  {
    id: text("id").primaryKey(),
    agentId: text("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    displayName: text("display_name").notNull(),
    authType: text("auth_type", {
      enum: ["api_key", "oauth", "webhook", "service_account"],
    }).notNull(),
    scopes: text("scopes"),
    configJson: text("config_json", { mode: "json" })
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
    createdAt: timestamp("created_at"),
    updatedAt: updatedTimestamp("updated_at"),
  },
  (table) => [
    uniqueIndex("agent_connections_agent_provider_name_idx").on(
      table.agentId,
      table.provider,
      table.displayName
    ),
    index("agent_connections_agent_idx").on(table.agentId),
  ]
);

export const scheduledTasks = sqliteTable(
  "agent_scheduled_tasks",
  {
    id: text("id").primaryKey(),
    agentId: text("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    schedule: text("schedule").notNull(),
    prompt: text("prompt").notNull().default(""),
    timezone: text("timezone").notNull().default("UTC"),
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
    lastRunAt: integer("last_run_at", { mode: "timestamp_ms" }),
    createdAt: timestamp("created_at"),
    updatedAt: updatedTimestamp("updated_at"),
  },
  (table) => [
    uniqueIndex("agent_scheduled_tasks_agent_name_idx").on(
      table.agentId,
      table.name
    ),
    index("agent_scheduled_tasks_agent_idx").on(table.agentId),
  ]
);

export const workflowTasks = sqliteTable(
  "agent_workflow_tasks",
  {
    id: text("id").primaryKey(),
    agentId: text("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    trigger: text("trigger", {
      enum: ["manual", "schedule", "webhook", "channel_event"],
    }).notNull(),
    stepsJson: text("steps_json", { mode: "json" })
      .$type<Array<{ title: string; instruction: string }>>()
      .notNull()
      .default([]),
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
    createdAt: timestamp("created_at"),
    updatedAt: updatedTimestamp("updated_at"),
  },
  (table) => [
    uniqueIndex("agent_workflow_tasks_agent_name_idx").on(
      table.agentId,
      table.name
    ),
    index("agent_workflow_tasks_agent_idx").on(table.agentId),
  ]
);

export const deployments = sqliteTable(
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
    // cloudflareAccountId: text("cloudflare_account_id"),
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

export const deploymentEvents = sqliteTable(
  "agent_deployment_events",
  {
    id: text("id").primaryKey(),
    deploymentId: text("deployment_id")
      .notNull()
      .references(() => deployments.id, { onDelete: "cascade" }),
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
  tools: many(tools),
  dependencies: many(dependencies),
  subagents: many(subagents),
  skills: many(skills),
  channels: many(channels),
  connections: many(connections),
  scheduledTasks: many(scheduledTasks),
  workflowTasks: many(workflowTasks),
  deployments: many(deployments),
}));

export const dependenciesRelations = relations(dependencies, ({ one }) => ({
  agent: one(agents, {
    fields: [dependencies.agentId],
    references: [agents.id],
  }),
}));

export const toolsRelations = relations(tools, ({ one }) => ({
  agent: one(agents, {
    fields: [tools.agentId],
    references: [agents.id],
  }),
}));

export const subagentsRelations = relations(subagents, ({ many, one }) => ({
  agent: one(agents, {
    fields: [subagents.agentId],
    references: [agents.id],
  }),
  tools: many(subagentTools),
}));

export const subagentToolsRelations = relations(subagentTools, ({ one }) => ({
  subagent: one(subagents, {
    fields: [subagentTools.subagentId],
    references: [subagents.id],
  }),
}));

export const skillsRelations = relations(skills, ({ many, one }) => ({
  agent: one(agents, {
    fields: [skills.agentId],
    references: [agents.id],
  }),
  resources: many(skillResources),
}));

export const skillResourcesRelations = relations(skillResources, ({ one }) => ({
  skill: one(skills, {
    fields: [skillResources.skillId],
    references: [skills.id],
  }),
}));

export const channelsRelations = relations(channels, ({ one }) => ({
  agent: one(agents, {
    fields: [channels.agentId],
    references: [agents.id],
  }),
}));

export const connectionsRelations = relations(connections, ({ one }) => ({
  agent: one(agents, {
    fields: [connections.agentId],
    references: [agents.id],
  }),
}));

export const scheduledTasksRelations = relations(scheduledTasks, ({ one }) => ({
  agent: one(agents, {
    fields: [scheduledTasks.agentId],
    references: [agents.id],
  }),
}));

export const workflowTasksRelations = relations(workflowTasks, ({ one }) => ({
  agent: one(agents, {
    fields: [workflowTasks.agentId],
    references: [agents.id],
  }),
}));

export const deploymentsRelations = relations(deployments, ({ many, one }) => ({
  agent: one(agents, {
    fields: [deployments.agentId],
    references: [agents.id],
  }),
  events: many(deploymentEvents),
}));

export const deploymentEventsRelations = relations(
  deploymentEvents,
  ({ one }) => ({
    deployment: one(deployments, {
      fields: [deploymentEvents.deploymentId],
      references: [deployments.id],
    }),
  })
);

export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;
export type AgentDependency = typeof dependencies.$inferSelect;
export type NewAgentDependency = typeof dependencies.$inferInsert;
export type AgentTool = typeof tools.$inferSelect;
export type NewAgentTool = typeof tools.$inferInsert;
export type AgentSubagent = typeof subagents.$inferSelect;
export type NewAgentSubagent = typeof subagents.$inferInsert;
export type AgentSubagentTool = typeof subagentTools.$inferSelect;
export type NewAgentSubagentTool = typeof subagentTools.$inferInsert;
export type AgentSkill = typeof skills.$inferSelect;
export type NewAgentSkill = typeof skills.$inferInsert;
export type AgentSkillResource = typeof skillResources.$inferSelect;
export type NewAgentSkillResource = typeof skillResources.$inferInsert;
export type AgentChannel = typeof channels.$inferSelect;
export type NewAgentChannel = typeof channels.$inferInsert;
export type AgentConnection = typeof connections.$inferSelect;
export type NewAgentConnection = typeof connections.$inferInsert;
export type AgentScheduledTask = typeof scheduledTasks.$inferSelect;
export type NewAgentScheduledTask = typeof scheduledTasks.$inferInsert;
export type AgentWorkflowTask = typeof workflowTasks.$inferSelect;
export type NewAgentWorkflowTask = typeof workflowTasks.$inferInsert;
export type AgentDeployment = typeof deployments.$inferSelect;
export type NewAgentDeployment = typeof deployments.$inferInsert;
export type AgentDeploymentEvent = typeof deploymentEvents.$inferSelect;
export type NewAgentDeploymentEvent = typeof deploymentEvents.$inferInsert;
