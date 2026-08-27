import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const timestamp = (name: string) =>
  integer(name, { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull();

export const waitlistEntries = sqliteTable(
  "waitlist_entries",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    createdAt: timestamp("created_at"),
  },
  (table) => [uniqueIndex("waitlist_entries_email_idx").on(table.email)]
);

export type WaitlistEntry = typeof waitlistEntries.$inferSelect;
export type NewWaitlistEntry = typeof waitlistEntries.$inferInsert;
