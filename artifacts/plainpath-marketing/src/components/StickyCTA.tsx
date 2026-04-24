import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, X } from "lucide-react"

const DISMISS_KEY = "pp-sticky-dismissed"

export function StickyCTA() {
  const [scrolled, setScrolled] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem(DISMISS_KEY)) {
      setDismissed(true)
      return
    }
    const handler = () => setScrolled(window.scrollY > 700)
    window.addEventListener("scroll", handler, { passive: true })
    handler()
    return () => window.removeEventListener("scroll", handler)
  }, [])

  function dismiss() {
    setDismissed(true)
    sessionStorage.setItem(DISMISS_KEY, "1")
  }

  const visible = scrolled && !dismissed

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-lg pointer-events-auto"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/96 backdrop-blur-lg shadow-2xl px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground leading-snug">
                Understand any document in plain English.
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                No account required · No credit card
              </p>
            </div>
            <a
              href="/demo"
              className="shrink-0 inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-primary/90 active:scale-95 transition-all shadow-sm whitespace-nowrap"
            >
              Try free <ArrowRight className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={dismiss}
              aria-label="Dismiss"
              className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors border-0 bg-transparent cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
