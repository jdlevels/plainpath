/**
 * Platform detection utilities for PlainPath.
 *
 * Capacitor injects a `window.Capacitor` object when the app runs inside a
 * native shell (iOS / Android). This object is absent in a regular browser.
 *
 * All helpers guard against SSR / non-browser environments and are safe to
 * call at the module level or inside React components without wrapping in
 * useEffect.
 */

export type NativePlatform = "ios" | "android";
export type Platform = "web" | NativePlatform;

interface CapacitorGlobal {
  isNative: boolean;
  getPlatform: () => string;
}

function getCapacitorGlobal(): CapacitorGlobal | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;
}

/**
 * Returns true when running inside a Capacitor native shell (iOS or Android).
 * Returns false in all browser contexts.
 *
 * Two checks in priority order:
 *   1. Capacitor bridge: window.Capacitor.isNative (set by the native bridge
 *      before any JS runs in a true Capacitor WebView).
 *   2. Origin fallback: capacitor:// and bare http/https localhost schemes are
 *      exclusive to Capacitor/simulator — no production web server ever runs
 *      there.  This catches the case where the bridge hasn't been injected yet
 *      or the platform detection is called at module-evaluation time.
 */
export function isNative(): boolean {
  if (getCapacitorGlobal()?.isNative === true) return true;
  if (typeof window !== "undefined") {
    const o = window.location.origin;
    if (o === "capacitor://localhost" || o === "http://localhost" || o === "https://localhost") {
      return true;
    }
  }
  return false;
}

/**
 * Returns true when running in a standard web browser (not a native shell).
 */
export function isWeb(): boolean {
  return !isNative();
}

/**
 * Returns the current platform: "ios", "android", or "web".
 *
 * Safe to call before Capacitor is initialized — returns "web" when
 * `window.Capacitor` is absent or not yet injected.
 */
export function getPlatform(): Platform {
  const cap = getCapacitorGlobal();
  if (!cap?.isNative) return "web";
  const p = cap.getPlatform().toLowerCase();
  if (p === "ios" || p === "android") return p as NativePlatform;
  return "web";
}
