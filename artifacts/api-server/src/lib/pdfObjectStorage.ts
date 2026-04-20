// ─── PDF Object Storage Wrapper ───────────────────────────────────────────────
// All GCS interactions for the PDF Editor are funnelled through this module.
// Routes must not call the storage SDK directly.
//
// Storage layout:  pdf-editor/{userId}/{sessionId}.pdf
//
// Additive fallback: if DEFAULT_OBJECT_STORAGE_BUCKET_ID is not set, all
// methods return null / throw, and callers fall back to bytea.

import { Storage } from "@google-cloud/storage";

// Replit's object storage sidecar endpoint.
// Must use these credentials — new Storage() without explicit config tries ADC
// (GCP metadata service at 169.254.169.254) which is unreachable on Replit.
const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

// Lazy-initialise so the module can be imported even when the env var is absent.
let _storage: Storage | null = null;

function getStorage(): Storage {
  if (!_storage) {
    _storage = new Storage({
      credentials: {
        audience: "replit",
        subject_token_type: "access_token",
        token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
        type: "external_account",
        credential_source: {
          url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
          format: {
            type: "json",
            subject_token_field_name: "access_token",
          },
        },
        universe_domain: "googleapis.com",
      } as any,
      projectId: "",
    });
  }
  return _storage;
}

function bucketId(): string | null {
  return process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID ?? null;
}

/** True when object storage is configured and available. */
export function isObjectStorageAvailable(): boolean {
  return bucketId() !== null;
}

/**
 * Upload a PDF buffer to object storage.
 * Returns the object path stored in `pdf_storage_key`, or null if storage
 * is not configured (caller should fall back to bytea).
 */
export async function uploadPdf(
  userId: string,
  sessionId: string,
  buffer: Buffer,
): Promise<string | null> {
  const bid = bucketId();
  if (!bid) return null;

  const objectPath = `pdf-editor/${userId}/${sessionId}.pdf`;
  const file = getStorage().bucket(bid).file(objectPath);

  await file.save(buffer, {
    contentType: "application/pdf",
    resumable: false,
  });

  return objectPath;
}

/**
 * Download a PDF from object storage by its storage key.
 * Throws if the object is not found or storage is unavailable.
 */
export async function downloadPdf(storageKey: string): Promise<Buffer> {
  const bid = bucketId();
  if (!bid) {
    throw new Error("Object storage is not configured");
  }

  const file = getStorage().bucket(bid).file(storageKey);
  const [contents] = await file.download();
  return Buffer.from(contents);
}

/**
 * Resolve the source PDF bytes for a session row.
 * Checks pdf_storage_key first (new sessions), falls back to pdf_bytes
 * (legacy sessions). Throws if neither is available.
 */
export async function resolvePdfBytes(row: {
  pdf_bytes: Buffer | null;
  pdf_storage_key: string | null;
}): Promise<Buffer> {
  if (row.pdf_storage_key) {
    return downloadPdf(row.pdf_storage_key);
  }
  if (row.pdf_bytes) {
    return row.pdf_bytes;
  }
  throw new Error("Session has no PDF source (neither pdf_bytes nor pdf_storage_key)");
}

/**
 * Upload any buffer to object storage at an explicit path.
 * Returns the stored object path, or null if storage is not configured.
 * Use this for tools that need non-standard storage paths.
 */
export async function uploadObject(
  objectPath: string,
  buffer: Buffer,
  contentType = "application/pdf",
): Promise<string | null> {
  const bid = bucketId();
  if (!bid) return null;

  const file = getStorage().bucket(bid).file(objectPath);
  await file.save(buffer, { contentType, resumable: false });
  return objectPath;
}

/**
 * Delete a stored PDF (best-effort, does not throw on failure).
 * Used when cleaning up a session. No-op if storage is not configured.
 */
export async function deletePdf(storageKey: string): Promise<void> {
  const bid = bucketId();
  if (!bid) return;
  try {
    await getStorage().bucket(bid).file(storageKey).delete();
  } catch {
    // best-effort
  }
}
