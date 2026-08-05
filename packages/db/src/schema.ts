import * as authSchema from "./auth.schema";
import * as agentSchema from "./agent.schema";

export const schema = {
  ...authSchema,
  ...agentSchema,
} as const;

export * from "./agent.schema";
export * from "./auth.schema";
