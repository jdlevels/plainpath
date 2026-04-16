import { useUser, useClerk } from "@clerk/react"
import { useEntitlements } from "@/hooks/useEntitlements"
import { Button } from "@/components/ui/button"
import {
  Lock, Zap, ArrowRight, Loader2,
  ShieldCheck, PenLine, Scale, BarChart3,
} from "lucide-react"
import { useLocation } from "wouter"

type ToolReason = "analyses" | "trustCheck" | "contractDraft" | "contractReview"
type RequiredPlan = "starter" | "pro"

interface ToolGateProps {
  children: React.ReactNode
  requiredPlan: RequiredPlan
  reason: ToolReason
}

const TOOL_META: Record<ToolReason, {
  icon: React.ElementType
  iconColor: string
  iconBg: string
  label: string
  signInSub: string
  upgradeSub: string
  planRequired: RequiredPlan
}> = {
  analyses: {
    icon: BarChart3,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
    label: "Document Analysis",
    signInSub: "Sign in to analyze documents. Free members get 2 analyses per month.",
    upgradeSub: "Upgrade to Starter for unlimited document analyses.",
    planRequired: "starter",
  },
  trustCheck: {
    icon: ShieldCheck,
    iconColor: "text-red-500",
    iconBg: "bg-red-50 dark:bg-red-950/50",
    label: "Document Trust Check",
    signInSub: "Sign in and upgrade to Pro to run document trust checks.",
    upgradeSub: "Document Trust Check requires a Pro plan. Upgrade to run unlimited trust checks.",
    planRequired: "pro",
  },
  contractDraft: {
    icon: PenLine,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-50 dark:bg-emerald-950/50",
    label: "Contract Builder",
    signInSub: "Sign in and upgrade to Pro to build AI-drafted contracts.",
    upgradeSub: "Contract Builder requires a Pro plan. Upgrade to generate unlimited contracts.",
    planRequired: "pro",
  },
  contractReview: {
    icon: Scale,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-50 dark:bg-amber-950/50",
    label: "Contract Review",
    signInSub: "Sign in and upgrade to Pro to get AI-powered contract reviews.",
    upgradeSub: "Contract Review requires a Pro plan. Upgrade to review unlimited contracts.",
    planRequired: "pro",
  },
}

const PRO_HIGHLIGHTS = [
  "Unlimited document analyses",
  "Document Trust Check",
  "AI Contract Builder",
  "AI Contract Review",
  "Save & share results",
]

const STARTER_HIGHLIGHTS = [
  "Unlimited document analyses",
  "Plain English summaries",
  "Key Terms, Deadlines & Risks",
  "Save & share results",
]

// Admin emails bypass — comma-separated in VITE_ADMIN_EMAILS env var
const ADMIN_EMAILS: string[] = (import.meta.env.VITE_ADMIN_EMAILS ?? "")
  .split(",")
  .map((e: string) => e.trim().toLowerCase())
  .filter(Boolean)

export default function ToolGate({ children, requiredPlan, reason }: ToolGateProps) {
  const { isSignedIn, user, isLoaded } = useUser()
  const { openSignIn } = useClerk()
  const { entitlements, loading } = useEntitlements()
  const [, setLocation] = useLocation()

  const meta = TOOL_META[reason]
  const Icon = meta.icon

  // Still loading auth or entitlements
  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Admin bypass — always let through
  const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase() ?? ""
  if (userEmail && ADMIN_EMAILS.includes(userEmail)) {
    return <>{children}</>
  }

  // ── Not signed in ─────────────────────────────────────────────────────────
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
        <div className="text-center max-w-sm w-full">
          <div className={`w-14 h-14 rounded-2xl ${meta.iconBg} flex items-center justify-center mx-auto mb-5`}>
            <Icon className={`w-7 h-7 ${meta.iconColor}`} />
          </div>

          <div className="inline-flex items-center gap-1.5 bg-secondary px-3 py-1 rounded-full mb-4">
            <Lock className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sign in required</span>
          </div>

          <h2 className="text-xl font-display font-bold text-foreground mb-2">{meta.label}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-7">{meta.signInSub}</p>

          <Button
            className="w-full h-11 rounded-xl gap-2 font-semibold shadow-sm mb-3"
            onClick={() => openSignIn()}
          >
            Sign in to continue
            <ArrowRight className="w-4 h-4" />
          </Button>
          <button
            onClick={() => setLocation("/")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to home
          </button>
        </div>
      </div>
    )
  }

  // ── Signed in — check plan ────────────────────────────────────────────────
  const plan = entitlements?.plan ?? null
  const hasAccess = requiredPlan === "starter"
    ? plan !== null
    : plan === "pro" || plan === "team"

  if (!hasAccess) {
    const highlights = requiredPlan === "pro" ? PRO_HIGHLIGHTS : STARTER_HIGHLIGHTS

    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
        <div className="text-center max-w-sm w-full">
          <div className={`w-14 h-14 rounded-2xl ${meta.iconBg} flex items-center justify-center mx-auto mb-5`}>
            <Icon className={`w-7 h-7 ${meta.iconColor}`} />
          </div>

          <div className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-800/40 px-3 py-1 rounded-full mb-4">
            <Zap className="w-3 h-3 text-amber-500" />
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
              {requiredPlan === "pro" ? "Pro" : "Starter"} required
            </span>
          </div>

          <h2 className="text-xl font-display font-bold text-foreground mb-2">{meta.label}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">{meta.upgradeSub}</p>

          <div className="bg-secondary/60 border border-border/40 rounded-2xl p-4 mb-6 text-left">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
              {requiredPlan === "pro" ? "Pro" : "Starter"} includes
            </p>
            <ul className="space-y-2">
              {highlights.map((h) => (
                <li key={h} className="flex items-center gap-2 text-sm text-foreground/80">
                  <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  </div>
                  {h}
                </li>
              ))}
            </ul>
          </div>

          <Button
            className="w-full h-11 rounded-xl gap-2 font-semibold shadow-sm mb-3"
            onClick={() => setLocation("/subscribe")}
          >
            View plans & pricing
            <ArrowRight className="w-4 h-4" />
          </Button>
          <button
            onClick={() => setLocation("/")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to home
          </button>
        </div>
      </div>
    )
  }

  // ── Authorized ────────────────────────────────────────────────────────────
  return <>{children}</>
}
