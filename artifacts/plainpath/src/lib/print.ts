/**
 * Platform-aware print / PDF export for PlainPath.
 *
 * On web:    delegates to window.print() (browser's native print dialog).
 * On native: window.print() is a no-op inside Capacitor's WebView and has
 *            no UI feedback. This module returns a typed result so the caller
 *            can show an appropriate message instead of silently doing nothing.
 *
 * When native PDF export is added (e.g. via a Capacitor Share/Filesystem
 * plugin), the implementation goes here — callers need no changes.
 */

import { isNative } from "./platform";

export type PrintResult =
  | { success: true }
  | { success: false; reason: "not_supported_on_native" };

/**
 * Triggers the system print dialog on web.
 * Returns a failure result on native so the caller can display
 * "PDF export coming soon" or similar messaging.
 */
export function triggerPrint(): PrintResult {
  if (isNative()) {
    return { success: false, reason: "not_supported_on_native" };
  }

  if (typeof window !== "undefined" && typeof window.print === "function") {
    window.print();
    return { success: true };
  }

  // Defensive fallback — should not be reached in a browser.
  return { success: false, reason: "not_supported_on_native" };
}
