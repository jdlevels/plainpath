import { Link } from "wouter"
import { XCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SubscribeCancel() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm text-center">

        <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mx-auto mb-5">
          <XCircle className="w-7 h-7 text-amber-600 dark:text-amber-400" />
        </div>

        <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-2">Checkout canceled</p>
        <h1 className="text-2xl font-display font-bold text-foreground mb-3">
          No charge was made
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-6">
          You can return to PlainPath and choose a plan whenever you're ready.
        </p>

        <Button asChild className="w-full gap-1.5">
          <Link href="/subscribe">
            View Plans <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm" className="mt-2 w-full text-muted-foreground">
          <Link href="/">Return to home</Link>
        </Button>
      </div>
    </div>
  )
}
