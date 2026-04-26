import {
  pgTable,
  text,
  uuid,
  integer,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

export const documentOverviewSessionsTable = pgTable(
  "document_overview_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    fileName: text("file_name").notNull(),
    fileSizeBytes: integer("file_size_bytes").notNull(),
    fileType: text("file_type").notNull().default("pdf"),
    pageCount: integer("page_count"),
    status: text("status").notNull().default("analyzing"),
    overview: jsonb("overview"),
    askSessionId: uuid("ask_session_id"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdx: index("document_overview_sessions_user_idx").on(
      table.userId,
      table.createdAt.desc(),
    ),
  }),
);

export type DocumentOverviewSession =
  typeof documentOverviewSessionsTable.$inferSelect;
