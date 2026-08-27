import * as authSchema from "./auth.schema";
import * as agentSchema from "./agent.schema";
import * as waitlistSchema from "./waitlist.schema";

export const schema = {
  ...authSchema,
  ...agentSchema,
  ...waitlistSchema,
} as const;

export * from "./agent.schema";
export * from "./auth.schema";
export * from "./waitlist.schema";
