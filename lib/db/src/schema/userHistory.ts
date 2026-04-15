import { pgTable, text, timestamp, jsonb, uuid } from "drizzle-orm/pg-core";

export const userAnalysesTable = pgTable("user_analyses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  sourceKind: text("source_kind").notNull().default("document"),
  documentTypeHint: text("document_type_hint"),
  analysis: jsonb("analysis").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userTrustChecksTable = pgTable("user_trust_checks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  analysis: jsonb("analysis").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type UserAnalysis = typeof userAnalysesTable.$inferSelect;
export type UserTrustCheck = typeof userTrustChecksTable.$inferSelect;
