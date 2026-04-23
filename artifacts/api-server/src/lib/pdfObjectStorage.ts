// ─── PDF Object Storage — sidecar presigned-URL approach ──────────────────────
// Direct GCS writes (file.save) are blocked by IAM — the service account only
// has permission to generate signed URLs, not to write objects directly.
// Solution: use the Replit sidecar at 127.0.0.1:1106 to generate presigned PUT/GET
// URLs, then fulfil uploads and downloads via those URLs.

const SIDECAR = "http://127.0.0.1:1106";
const BUCKET_ID = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID ?? "";

export function isObjectStorageAvailable(): boolean {
  return !!BUCKET_ID;
}

async function signUrl(
  objectName: string,
  method: "PUT" | "GET",
  ttlSec = 900,
): Promise<string> {
  const res = await fetch(`${SIDECAR}/object-storage/signed-object-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bucket_name: BUCKET_ID,
      object_name: objectName,
      method,
      expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Sidecar sign failed (${res.status}): ${text}`);
  }
  const { signed_url } = await res.json();
  return signed_url as string;
}

export async function uploadObject(key: string, buf: Buffer): Promise<boolean> {
  if (!isObjectStorageAvailable()) return false;
  try {
    const url = await signUrl(key, "PUT");
    const putRes = await fetch(url, {
      method: "PUT",
      body: buf,
      headers: { "Content-Type": "application/pdf" },
      signal: AbortSignal.timeout(120_000),
    });
    if (!putRes.ok) {
      const text = await putRes.text().catch(() => "");
      console.error(`[pdfObjectStorage] GCS PUT failed (${putRes.status}): ${text}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[pdfObjectStorage] uploadObject failed:", err);
    return false;
  }
}

export async function downloadPdf(key: string): Promise<Buffer> {
  if (!isObjectStorageAvailable()) {
    throw new Error("Object storage is not configured.");
  }
  const url = await signUrl(key, "GET");
  const res = await fetch(url, { signal: AbortSignal.timeout(120_000) });
  if (!res.ok) {
    throw new Error(`[pdfObjectStorage] GCS GET failed (${res.status}) for key: ${key}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

export async function uploadPdf(
  userId: string,
  sessionId: string,
  buf: Buffer,
  prefix = "compare-versions",
): Promise<string | null> {
  if (!isObjectStorageAvailable()) return null;
  const key = `${prefix}/${userId}/${sessionId}/revised.pdf`;
  const ok = await uploadObject(key, buf);
  return ok ? key : null;
}
