import { useEffect, useState } from "react"
import { Link } from "wouter"
import { CheckCircle2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { setStoredSubscriberEmail } from "../lib/subscriberStorage"
import { getApiBaseUrl } from "@/lib/api"

type SessionStatus = {
  customer_email: string | null
  payment_status: string
  status: string
  metadata?: Record<string, string>
}

export default function SubscribeSuccess() {
  const [sessionData, setSessionData] = useState<SessionStatus | null>(null)

  useEffect(() => {
    const url = new URL(window.location.href)
    const sessionId = url.searchParams.get("session_id")
    if (!sessionId) return

    const apiBase = getApiBaseUrl()
    fetch(`${apiBase}/api/stripe/checkout-session-status?session_id=${encodeURIComponent(sessionId)}`)
      .then((res) => res.json())
      .then((data: SessionStatus) => {
        setSessionData(data)
        if (data?.customer_email) {
          setStoredSubscriberEmail(data.customer_email)
        }
      })
      .catch(() => {})
  }, [])

  const plan = sessionData?.metadata?.plan ?? "starter"
  const planLabel = plan === "pro" ? "Pro" : "Starter"

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm text-center">

        <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
        </div>

        <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-2">Subscription started</p>
        <h1 className="text-2xl font-display font-bold text-foreground mb-3">
          Welcome to PlainPath
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-6">
          Your <strong className="text-foreground">{planLabel}</strong> plan is now active.
          {plan === "pro"
            ? " You now have access to all four PlainPath tools — Analyze, Trust Check, Contract Builder, and Contract Review."
            : " You now have unlimited document analyses."}
        </p>

        {sessionData?.customer_email && (
          <div className="rounded-xl border border-border/50 bg-secondary/30 px-4 py-3 text-sm text-left mb-6 space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium text-foreground">{sessionData.customer_email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-medium text-foreground">{planLabel}</span>
            </div>
          </div>
        )}

        <Button asChild className="w-full gap-1.5">
          <Link href="/import">
            Analyze a Document <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm" className="mt-2 w-full text-muted-foreground">
          <Link href="/">Return to home</Link>
        </Button>
      </div>
    </div>
  )
}
