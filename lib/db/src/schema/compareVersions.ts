import {
  pgTable,
  text,
  uuid,
  integer,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";

export const compareVersionsSessionsTable = pgTable("compare_versions_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  originalStorageKey: text("original_storage_key").notNull(),
  originalFileName: text("original_file_name").notNull(),
  originalPageCount: integer("original_page_count"),
  revisedStorageKey: text("revised_storage_key").notNull(),
  revisedFileName: text("revised_file_name").notNull(),
  revisedPageCount: integer("revised_page_count"),
  status: text("status").notNull().default("pending"),
  diffResult: jsonb("diff_result"),
  managerNotes: jsonb("manager_notes").notNull().default([]),
  scannedAt: timestamp("scanned_at", { withTimezone: true }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type CompareVersionsSession = typeof compareVersionsSessionsTable.$inferSelect;
