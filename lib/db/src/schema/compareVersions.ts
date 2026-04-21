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
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type CompareVersionsSession = typeof compareVersionsSessionsTable.$inferSelect;

export const cvHandoffRecordsTable = pgTable("cv_handoff_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  cvSessionId: uuid("cv_session_id").notNull(),
  pdfEditorSessionId: uuid("pdf_editor_session_id").notNull(),
  userId: text("user_id").notNull(),
  mode: text("mode").notNull().default("all"),
  selectedDiffIds: jsonb("selected_diff_ids"),
  highlightCount: integer("highlight_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type CvHandoffRecord = typeof cvHandoffRecordsTable.$inferSelect;
