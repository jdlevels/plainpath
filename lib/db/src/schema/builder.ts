import {
  pgTable,
  text,
  timestamp,
  jsonb,
  uuid,
  integer,
  boolean,
  unique,
} from "drizzle-orm/pg-core";

// ─── builder_documents ────────────────────────────────────────────────────────

export const builderDocumentsTable = pgTable("builder_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  status: text("status").notNull().default("draft"),
  source: text("source").notNull().default("blank"),
  templateId: uuid("template_id"),
  content: jsonb("content").notNull(),
  serverVersion: integer("server_version").notNull().default(1),
  latestSnapshotId: uuid("latest_snapshot_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type BuilderDocument = typeof builderDocumentsTable.$inferSelect;

// ─── builder_document_versions ────────────────────────────────────────────────

export const builderDocumentVersionsTable = pgTable(
  "builder_document_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => builderDocumentsTable.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    versionNumber: integer("version_number").notNull(),
    snapshot: jsonb("snapshot").notNull(),
    titleAtSnapshot: text("title_at_snapshot").notNull(),
    statusAtSnapshot: text("status_at_snapshot").notNull(),
    triggeredBy: text("triggered_by").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    uniqueVersionPerDoc: unique("uq_builder_version_per_doc").on(
      t.documentId,
      t.versionNumber,
    ),
  }),
);

export type BuilderDocumentVersion =
  typeof builderDocumentVersionsTable.$inferSelect;

// ─── builder_templates ────────────────────────────────────────────────────────

export const builderTemplatesTable = pgTable("builder_templates", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  isSystem: boolean("is_system").notNull().default(true),
  ownerUserId: text("owner_user_id"),
  content: jsonb("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type BuilderTemplate = typeof builderTemplatesTable.$inferSelect;

// ─── builder_export_artifacts ─────────────────────────────────────────────────

export const builderExportArtifactsTable = pgTable("builder_export_artifacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id")
    .notNull()
    .references(() => builderDocumentsTable.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  format: text("format").notNull().default("pdf"),
  storageKey: text("storage_key").notNull(),
  status: text("status").notNull().default("generating"),
  versionId: uuid("version_id")
    .notNull()
    .references(() => builderDocumentVersionsTable.id),
  fileSizeBytes: integer("file_size_bytes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export type BuilderExportArtifact =
  typeof builderExportArtifactsTable.$inferSelect;
