import { pgTable, text, timestamp, jsonb, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const documentsTable = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  sourceKind: text("source_kind").notNull().default("upload"),
  mimeType: text("mime_type"),
  originalFilename: text("original_filename"),
  extractedText: text("extracted_text"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  metadata: jsonb("metadata"),
});

export const documentToolRunsTable = pgTable("document_tool_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id").notNull().references(() => documentsTable.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  tool: text("tool").notNull(),
  outputRef: text("output_ref"),
  outputKind: text("output_kind"),
  resultSummary: text("result_summary"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  metadata: jsonb("metadata"),
});

export const insertDocumentSchema = createInsertSchema(documentsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentToolRunSchema = createInsertSchema(documentToolRunsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documentsTable.$inferSelect;
export type DocumentToolRun = typeof documentToolRunsTable.$inferSelect;
