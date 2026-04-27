import {
  pgTable,
  text,
  varchar,
  integer,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const clauseExtractorSessionsTable = pgTable("clause_extractor_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  fileName: text("file_name").notNull(),
  fileSizeBytes: integer("file_size_bytes").notNull(),
  fileType: text("file_type").notNull().default("pdf"),
  status: text("status").notNull().default("pending"),
  results: jsonb("results"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ClauseExtractorSession = typeof clauseExtractorSessionsTable.$inferSelect;
