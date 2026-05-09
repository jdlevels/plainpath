// ─── PaywallPreview ───────────────────────────────────────────────────────────
//
// Standalone route: /paywall-preview
//
// PURPOSE — App Store screenshot capture.
// Renders the exact same paywall UI shown to iOS users on-device. No auth
// guard, no isNative() check. Buttons call the real native purchase/restore
// handlers — on web these return gracefully ("Native billing not available on
// web"), so no fake purchase behavior occurs.
//
// HOW TO CAPTURE THE APP STORE SCREENSHOT:
//   See "Screenshot capture instructions" in the App Store submission docs,
//   or follow the inline guide at the bottom of this file.
//
// HARD RESTRICTIONS:
//   - Do not add Stripe, hidden tools, or any tool not in the launch set.
//   - Do not show Trust Check, Redact, Compare Versions, Clause Extractor, or
//     Contract Builder.
//   - Do not change pricing ($19.99/month).
//
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react"
import { Zap, Check, ArrowRight, Loader2, LogOut } from "lucide-react"
import { purchaseNativePlan, restoreNativePurchases } from "@/lib/nativeBilling"

const TERMS_URL  = "https://plain-path.replit.app/terms"
const PRIVACY_URL = "https://plain-path.replit.app/privacy"

const FEATURES = [
  "Analyze a Document",
  "Contract Review",
  "Saved analysis history",
] as const

export default function PaywallPreview() {
  const [purchasing, setPurchasing]   = useState(false)
  const [restoring,  setRestoring]    = useState(false)
  const [error,      setError]        = useState<string | null>(null)
  const [successMsg, setSuccessMsg]   = useState<string | null>(null)

  useEffect(() => {
    document.title = "PlainPath Pro — Subscribe"
    return () => { document.title = "PlainPath" }
  }, [])

  const isWorking = purchasing || restoring

  async function handleSubscribe() {
    setPurchasing(true)
    setError(null)
    setSuccessMsg(null)
    try {
      const result = await purchaseNativePlan("pro")
      if (result.success) {
        setSuccessMsg("Welcome to PlainPath Pro!")
      } else {
        setError(result.error ?? "Purchase failed. Please try again.")
      }
    } finally {
      setPurchasing(false)
    }
  }

  async function handleRestore() {
    setRestoring(true)
    setError(null)
    setSuccessMsg(null)
    try {
      const result = await restoreNativePurchases()
      if (result.success && result.plan) {
        setSuccessMsg("Subscription restored. Welcome back!")
      } else {
        setError("No active subscription found for this account.")
      }
    } finally {
      setRestoring(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Header ── */}
      <header className="border-b border-border/40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src="/logo.svg"
            alt="PlainPath"
            className="h-6 w-6"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
          />
          <span className="font-bold text-base tracking-tight">PlainPath</span>
        </div>
        <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </header>

      {/* ── Body ── */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">

          {/* Plan title + price */}
          <div className="text-center mb-8">
            <div className="bg-primary/10 p-4 rounded-2xl w-fit mx-auto mb-4">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">
              PlainPath Pro
            </h1>
            <div className="mt-3">
              <span className="text-3xl font-bold text-foreground">$19.99</span>
              <span className="text-base font-normal text-muted-foreground">/month</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Cancel anytime — no commitment</p>
          </div>

          {/* Feature list */}
          <ul className="space-y-2.5 mb-8">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-foreground/80">
                <Check className="w-4 h-4 text-primary shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          {/* Error / success banners */}
          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 mb-4 text-sm text-destructive">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/8 px-4 py-3 mb-4 text-sm text-emerald-700 dark:text-emerald-400">
              {successMsg}
            </div>
          )}

          {/* Subscribe button */}
          <button
            onClick={() => void handleSubscribe()}
            disabled={isWorking}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm mb-3"
          >
            {purchasing ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Processing…</>
            ) : (
              <>Subscribe<ArrowRight className="w-4 h-4" /></>
            )}
          </button>

          {/* Restore purchases button */}
          <button
            onClick={() => void handleRestore()}
            disabled={isWorking}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {restoring ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" />Restoring…</>
            ) : (
              "Restore Purchases"
            )}
          </button>

          {/* Terms + Privacy */}
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground/60 leading-relaxed">
              By subscribing you agree to our{" "}
              <a
                href={TERMS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-muted-foreground transition-colors"
              >
                Terms of Service
              </a>
              {" "}and{" "}
              <a
                href={PRIVACY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-muted-foreground transition-colors"
              >
                Privacy Policy
              </a>
              . Subscription auto-renews monthly. Cancel anytime in iPhone Settings.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
