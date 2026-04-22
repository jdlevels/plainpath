import {
  pgTable,
  text,
  uuid,
  integer,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";

export const clauseExtractorSessionsTable = pgTable("clause_extractor_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
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
