import { getApiBaseUrl } from "./api";

export type SignatureStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "signed"
  | "declined"
  | "failed"
  | "expired";

export interface SignatureRequest {
  id: string;
  documentName: string;
  signerName: string;
  signerEmail: string;
  signerRole: string | null;
  requestMessage: string | null;
  status: SignatureStatus;
  providerName: string;
  providerRequestId: string | null;
  providerSignatureId: string | null;
  testMode: boolean;
  createdAt: string;
  updatedAt: string;
  sentAt: string | null;
  viewedAt: string | null;
  completedAt: string | null;
  declinedAt: string | null;
  expiredAt: string | null;
  failedAt: string | null;
  failureReason: string | null;
  signedFileUrl: string | null;
  metadata: Record<string, unknown> | null;
  events: SignatureEvent[];
}

export interface SignatureListItem {
  id: string;
  documentName: string;
  signerName: string;
  signerEmail: string;
  signerRole: string | null;
  status: SignatureStatus;
  providerRequestId: string | null;
  testMode: boolean;
  createdAt: string;
  sentAt: string | null;
  completedAt: string | null;
  signedFileUrl: string | null;
}

export interface SignatureEvent {
  id: string;
  providerEventName: string;
  appStatusAfterEvent: string | null;
  occurredAt: string;
  receivedAt: string;
}

export interface SendSignaturePayload {
  file?: File | null;
  documentText?: string;
  documentName?: string;
  signerName: string;
  signerEmail: string;
  signerRole?: string;
  requestMessage?: string;
}

export interface SendSignatureResult {
  ok: boolean;
  signatureRequestId: string;
  providerRequestId?: string;
  status: string;
  message: string;
  error?: string;
}

const base = () => getApiBaseUrl();

export async function listSignatureRequests(): Promise<SignatureListItem[]> {
  const res = await fetch(`${base()}/api/signatures`, { credentials: "include" });
  if (!res.ok) throw new Error(`Failed to load signature requests (${res.status})`);
  return res.json();
}

export async function getSignatureRequest(id: string): Promise<SignatureRequest> {
  const res = await fetch(`${base()}/api/signatures/${id}`, { credentials: "include" });
  if (!res.ok) throw new Error(`Failed to load signature request (${res.status})`);
  return res.json();
}

export async function sendSignatureRequest(
  payload: SendSignaturePayload
): Promise<SendSignatureResult> {
  const formData = new FormData();
  if (payload.file) formData.append("file", payload.file);
  if (payload.documentText) formData.append("documentText", payload.documentText);
  if (payload.documentName) formData.append("documentName", payload.documentName);
  formData.append("signerName", payload.signerName);
  formData.append("signerEmail", payload.signerEmail);
  if (payload.signerRole) formData.append("signerRole", payload.signerRole);
  if (payload.requestMessage) formData.append("requestMessage", payload.requestMessage);

  const res = await fetch(`${base()}/api/signatures/send`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  const data = await res.json() as SendSignatureResult;
  return data;
}

export async function refreshSignatureStatus(
  id: string
): Promise<{ status: SignatureStatus; refreshed: boolean }> {
  const res = await fetch(`${base()}/api/signatures/${id}/refresh`, { credentials: "include" });
  if (!res.ok) throw new Error(`Failed to refresh status (${res.status})`);
  return res.json();
}

export function getSignatureDownloadUrl(id: string): string {
  return `${base()}/api/signatures/${id}/download`;
}

export async function deleteSignatureRequest(id: string): Promise<void> {
  const res = await fetch(`${base()}/api/signatures/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to delete (${res.status})`);
}

export const STATUS_LABELS: Record<SignatureStatus, string> = {
  draft: "Draft",
  sent: "Awaiting Signature",
  viewed: "Opened",
  signed: "Signed",
  declined: "Declined",
  failed: "Failed",
  expired: "Expired",
};

export const STATUS_COLORS: Record<SignatureStatus, string> = {
  draft: "text-muted-foreground bg-muted/60 border-border/40",
  sent: "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-800/40",
  viewed: "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-800/40",
  signed: "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800/40",
  declined: "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border-red-200/60 dark:border-red-800/40",
  failed: "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border-red-200/60 dark:border-red-800/40",
  expired: "text-muted-foreground bg-muted/60 border-border/40",
};

export const EVENT_LABELS: Record<string, string> = {
  signature_request_sent: "Request sent to signer",
  signature_request_viewed: "Signer opened the document",
  signature_request_signed: "Signer signed the document",
  signature_request_all_signed: "All parties signed",
  signature_request_declined: "Signer declined to sign",
  signature_request_expired: "Request expired",
  signature_request_canceled: "Request canceled",
  signature_request_remind: "Reminder sent to signer",
  signature_request_reassigned: "Signer reassigned",
  signature_request_invalid: "Request invalid",
  refresh_sent: "Status refreshed: awaiting signature",
  refresh_viewed: "Status refreshed: viewed",
  refresh_signed: "Status refreshed: signed",
  refresh_declined: "Status refreshed: declined",
  refresh_expired: "Status refreshed: expired",
};
