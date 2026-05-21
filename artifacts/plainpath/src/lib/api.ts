/**
 * API base URL resolution for PlainPath.
 *
 * Strategy:
 *  - Web browser: empty string → same-origin requests (no base URL needed).
 *  - Capacitor native build: absolute URL from VITE_API_BASE_URL (required).
 *
 * A clear console error is emitted when a native build is missing the env var
 * so it surfaces immediately during development/QA rather than causing
 * silent network failures later.
 */

import { isNative } from "./platform";

/**
 * Returns the base URL for all API requests.
 *
 * Call once at app startup and pass the result to `setBaseUrl()` from the
 * API client. Do NOT call `import.meta.env.VITE_API_BASE_URL` directly
 * elsewhere — always go through this function so native-safety logic is
 * applied consistently.
 */
export function getApiBaseUrl(): string {
  // In native (Capacitor) builds the WKWebView origin is capacitor://localhost.
  // We must use an absolute production URL so all /api/* calls reach the server.
  // Hardcoded here (not from env) so the native base URL is always correct
  // regardless of which .env file the CI build reads, and so .env.production
  // (used by the web build) is never affected by native-specific changes.
  if (isNative()) {
    return "https://plainpathapp.com";
  }

  // Web browser: VITE_API_BASE_URL is empty in dev (same-origin proxy) and
  // set to the deployed origin in production. Never touch this for native.
  const envUrl = ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "")
    .trim()
    .replace(/\/+$/, "");

  return envUrl;
}
