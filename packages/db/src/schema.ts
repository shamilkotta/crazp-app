import * as authSchema from "./auth.schema";
import { agents } from "./app-schema";

export const schema = {
  ...authSchema,
  agents,
} as const;

export * from "./app-schema";
export * from "./auth.schema";
