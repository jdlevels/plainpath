import { useLocation } from "wouter"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Zap, ShieldCheck, PenLine, GitCompare, ArrowRight, X, Scale } from "lucide-react"
import { isNative } from "@/lib/platform"

interface Props {
  open: boolean
  onClose: () => void
  reason: "analyses" | "trustCheck" | "contractDraft" | "contractReview" | "redact" | "compare"
  used?: number
  limit?: number
  planRequired?: "starter" | "pro"
}

const REASON_COPY = {
  analyses: {
    title: "You've used your 2 free analyses this month",
    sub: "Upgrade to Starter for unlimited document analyses — or Pro for all 8 tools.",
    icon: <GitCompare className="w-6 h-6 text-primary" />,
    planRequired: "starter" as const,
  },
  trustCheck: {
    title: "Document Trust Check requires Pro",
    sub: "Upgrade to Pro to run unlimited trust checks on any document.",
    icon: <ShieldCheck className="w-6 h-6 text-red-500" />,
    planRequired: "pro" as const,
  },
  contractDraft: {
    title: "Contract Builder requires Pro",
    sub: "Upgrade to Pro to generate unlimited AI-drafted contracts.",
    icon: <PenLine className="w-6 h-6 text-emerald-500" />,
    planRequired: "pro" as const,
  },
  contractReview: {
    title: "Contract Review requires Pro",
    sub: "Upgrade to Pro to run unlimited AI-powered contract reviews.",
    icon: <Scale className="w-6 h-6 text-amber-500" />,
    planRequired: "pro" as const,
  },
  redact: {
    title: "Redact Sensitive Info requires a subscription",
    sub: "Upgrade to Starter or Pro to automatically detect and redact PII from any document.",
    icon: <ShieldCheck className="w-6 h-6 text-violet-500" />,
    planRequired: "starter" as const,
  },
  compare: {
    title: "Compare Document Versions requires Pro",
    sub: "Upgrade to Pro to side-by-side compare any two versions of a document and highlight every change.",
    icon: <GitCompare className="w-6 h-6 text-teal-500" />,
    planRequired: "pro" as const,
  },
}

const PLAN_HIGHLIGHTS = {
  starter: [
    "Unlimited document analyses",
    "Redact Sensitive Info (automatic PII removal)",
    "Plain English summary & full Action Pack",
    "Key Terms, Deadlines, Risks",
    "Shareable analysis links",
  ],
  pro: [
    "Everything in Starter",
    "Unlimited Document Trust Checks",
    "Build a Contract (AI-drafted)",
    "AI Contract Review",
    "Compare Versions & Clause Extractor",
  ],
}

export default function UpgradeModal({ open, onClose, reason, used, limit }: Props) {
  const [, setLocation] = useLocation()
  const copy = REASON_COPY[reason]

  const handleUpgrade = () => {
    onClose()
    setLocation("/upgrade")
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden rounded-2xl border border-border/60 shadow-2xl">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-primary/8 via-primary/4 to-background px-6 pt-6 pb-5 border-b border-border/40">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-background border border-border/50 rounded-xl p-2.5 shadow-sm">
              {copy.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                  Upgrade required
                </span>
              </div>
              {used !== undefined && limit !== undefined && limit > 0 && limit !== Infinity && (
                <p className="text-xs text-muted-foreground">
                  {used} of {limit} used this month
                </p>
              )}
            </div>
          </div>
          <h2 className="text-lg font-display font-bold text-foreground leading-snug mb-1">
            {copy.title}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{copy.sub}</p>
        </div>

        {/* Plan highlights */}
        <div className="px-6 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            {copy.planRequired === "starter" ? "Starter includes" : "Pro includes"}
          </p>
          <ul className="space-y-2">
            {PLAN_HIGHLIGHTS[copy.planRequired].map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-foreground/80">
                <div className="mt-0.5 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                </div>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="px-6 pb-5 flex flex-col gap-2.5">
          {isNative() ? (
            <div className="rounded-xl border border-border/50 bg-secondary/50 px-4 py-3 text-center">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Pro subscription required. Visit{" "}
                <span className="font-semibold text-foreground">plainpathapp.com</span>
                {" "}to manage your plan.
              </p>
            </div>
          ) : (
            <Button
              className="w-full h-11 rounded-xl gap-2 font-semibold shadow-sm"
              onClick={handleUpgrade}
            >
              View plans & pricing
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
          <button
            onClick={onClose}
            className="text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            {isNative() ? "OK" : "Maybe later"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
