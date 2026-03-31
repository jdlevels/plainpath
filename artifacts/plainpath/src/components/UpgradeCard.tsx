import { Sparkles } from "lucide-react"
import { startStripeCheckout } from "@/lib/stripe"
import { useState } from "react"

type Props = {
  title: string
  description: string
}

export default function UpgradeCard({ title, description }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUpgrade() {
    try {
      setError(null)
      setLoading(true)
      await startStripeCheckout("pro")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start checkout")
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-6 dark:border-blue-900/40 dark:bg-blue-950/20">
      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
        <Sparkles className="h-5 w-5" />
        <span className="text-sm font-semibold">Pro feature</span>
      </div>

      <div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
          {title}
        </h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={() => void handleUpgrade()}
        disabled={loading}
        className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70"
      >
        {loading ? "Redirecting..." : "Upgrade to Pro"}
      </button>

      {error ? (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  )
}
