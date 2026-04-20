import {
  pgTable,
  text,
  uuid,
  integer,
  jsonb,
  timestamp,
  customType,
} from "drizzle-orm/pg-core";

// ─── bytea custom type ────────────────────────────────────────────────────────
// node-postgres (pg) automatically serialises Buffer ↔ bytea.

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

// ─── pdf_editor_sessions ──────────────────────────────────────────────────────

export const pdfEditorSessionsTable = pgTable("pdf_editor_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  fileName: text("file_name").notNull(),
  fileSizeBytes: integer("file_size_bytes").notNull(),
  pageCount: integer("page_count"),
  pdfBytes: bytea("pdf_bytes").notNull(),
  ops: jsonb("ops").notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type PdfEditorSession = typeof pdfEditorSessionsTable.$inferSelect;
