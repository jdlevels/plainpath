import { pgTable, text, timestamp, jsonb, boolean, uuid } from "drizzle-orm/pg-core";

export const signatureRequestsTable = pgTable("signature_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  documentName: text("document_name").notNull(),
  signerName: text("signer_name").notNull(),
  signerEmail: text("signer_email").notNull(),
  signerRole: text("signer_role"),
  requestMessage: text("request_message"),
  providerName: text("provider_name").notNull().default("dropbox_sign"),
  providerRequestId: text("provider_request_id"),
  providerSignatureId: text("provider_signature_id"),
  status: text("status").notNull().default("draft"),
  testMode: boolean("test_mode").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  sentAt: timestamp("sent_at"),
  viewedAt: timestamp("viewed_at"),
  completedAt: timestamp("completed_at"),
  declinedAt: timestamp("declined_at"),
  expiredAt: timestamp("expired_at"),
  failedAt: timestamp("failed_at"),
  failureReason: text("failure_reason"),
  signedFileUrl: text("signed_file_url"),
  metadata: jsonb("metadata"),
});

export const signatureRequestEventsTable = pgTable("signature_request_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  signatureRequestId: uuid("signature_request_id").notNull(),
  providerName: text("provider_name").notNull().default("dropbox_sign"),
  providerEventName: text("provider_event_name").notNull(),
  appStatusAfterEvent: text("app_status_after_event"),
  payloadJson: jsonb("payload_json"),
  occurredAt: timestamp("occurred_at").notNull(),
  receivedAt: timestamp("received_at").defaultNow().notNull(),
  dedupeKey: text("dedupe_key"),
});

export type SignatureRequest = typeof signatureRequestsTable.$inferSelect;
export type SignatureRequestEvent = typeof signatureRequestEventsTable.$inferSelect;
