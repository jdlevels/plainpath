// ─── Browser Polyfills ─────────────────────────────────────────────────────────
// These run before any library code (pdfjs-dist, etc.)

// Map.prototype.getOrInsertComputed — requires Chrome 136+ but pdfjs-dist v5 uses it.
// Polyfill for older browsers and test environments (Chromium < 136).
if (typeof Map !== "undefined" && typeof (Map.prototype as any).getOrInsertComputed !== "function") {
  (Map.prototype as any).getOrInsertComputed = function <K, V>(
    this: Map<K, V>,
    key: K,
    func: (k: K) => V,
  ): V {
    if (!this.has(key)) {
      this.set(key, func(key))
    }
    return this.get(key) as V
  }
}
