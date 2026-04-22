import { Storage } from "@google-cloud/storage";

const BUCKET_ID = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID ?? "";

let _storage: Storage | null = null;

function getStorage(): Storage {
  if (!_storage) _storage = new Storage();
  return _storage;
}

export function isObjectStorageAvailable(): boolean {
  return !!BUCKET_ID;
}

export async function uploadObject(key: string, buf: Buffer): Promise<boolean> {
  if (!isObjectStorageAvailable()) return false;
  try {
    const file = getStorage().bucket(BUCKET_ID).file(key);
    await file.save(buf, { resumable: false });
    return true;
  } catch (err) {
    console.error("[pdfObjectStorage] uploadObject failed:", err);
    return false;
  }
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

export async function downloadPdf(key: string): Promise<Buffer> {
  if (!isObjectStorageAvailable()) {
    throw new Error("Object storage is not configured.");
  }
  const [data] = await getStorage().bucket(BUCKET_ID).file(key).download();
  return data as Buffer;
}
