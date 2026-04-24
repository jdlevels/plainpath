import { useState } from "react"
import { motion } from "framer-motion"
import { Mail, CheckCircle2, ArrowRight } from "lucide-react"

export function NewsletterCapture() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus("loading")
    setErrorMsg("")

    try {
      const res = await fetch("/api/waitlist/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), platform: "both", source: "newsletter" }),
      })
      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(
          data.error === "invalid_email"
            ? "Please enter a valid email address."
            : "Something went wrong. Please try again.",
        )
        setStatus("error")
        return
      }
      setStatus("success")
    } catch {
      setErrorMsg("Something went wrong. Please try again.")
      setStatus("error")
    }
  }

  return (
    <section className="py-16 md:py-20 border-b border-border/40 bg-gradient-to-b from-secondary/20 to-background">
      <div className="max-w-2xl mx-auto px-5 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/8 border border-primary/15 mb-4">
            <Mail className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">Document tips, free</span>
          </div>

          <h2
            className="text-2xl md:text-3xl font-bold text-foreground mb-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Know your rights before you sign.
          </h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
            Weekly plain-English tips on spotting contract red flags, understanding legal clauses, and protecting yourself from document traps. No spam, ever.
          </p>

          {status === "success" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400"
            >
              <CheckCircle2 className="w-4 h-4" />
              You're in — we'll be in touch.
            </motion.div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-2.5 max-w-md mx-auto"
            >
              <input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={status === "loading"}
                className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60 whitespace-nowrap"
              >
                {status === "loading" ? "Subscribing…" : (
                  <>Subscribe <ArrowRight className="w-3.5 h-3.5" /></>
                )}
              </button>
            </form>
          )}

          {errorMsg && (
            <p className="mt-2 text-xs text-destructive">{errorMsg}</p>
          )}
          {status !== "success" && (
            <p className="mt-3 text-xs text-muted-foreground">
              Unsubscribe any time · No spam · No credit card
            </p>
          )}
        </motion.div>
      </div>
    </section>
  )
}
