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
  const envUrl = ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "")
    .trim()
    .replace(/\/+$/, "");

  if (isNative() && !envUrl) {
    const msg =
      "[PlainPath] VITE_API_BASE_URL is required for native (Capacitor) builds " +
      "but was not provided. All API calls will fail. " +
      "Set it to your deployed API URL, e.g. https://api.plainpath.app";
    // Log at error level so it surfaces in crash reporters and Xcode/Android Studio consoles.
    console.error(msg);
  }

  return envUrl;
}
