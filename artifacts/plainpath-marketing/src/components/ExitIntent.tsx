import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ArrowRight, FileText } from "lucide-react"

const DISMISSED_KEY = "plainpath_before_you_go_dismissed_until"
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours

function isDismissed(): boolean {
  try {
    const until = localStorage.getItem(DISMISSED_KEY)
    if (!until) return false
    return Date.now() < Number(until)
  } catch {
    return false
  }
}

function setDismissed(): void {
  try {
    localStorage.setItem(DISMISSED_KEY, String(Date.now() + DISMISS_DURATION_MS))
  } catch {
    // localStorage unavailable — degrade gracefully
  }
}

export function ExitIntent() {
  const [show, setShow] = useState(false)
  // Once dismissed in this session, block re-triggering until page reload
  const [permanentlyClosed, setPermanentlyClosed] = useState(false)

  useEffect(() => {
    // If already dismissed (localStorage) or closed this session, skip
    if (isDismissed() || permanentlyClosed) return

    let userScrolled = false
    const onScroll = () => { if (window.scrollY > 400) userScrolled = true }
    const onLeave = (e: MouseEvent) => {
      if (!userScrolled) return
      if (permanentlyClosed || isDismissed()) return
      if (e.clientY < 8) setShow(true)
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    document.addEventListener("mouseleave", onLeave)
    return () => {
      window.removeEventListener("scroll", onScroll)
      document.removeEventListener("mouseleave", onLeave)
    }
  }, [permanentlyClosed])

  function dismiss() {
    setShow(false)
    setPermanentlyClosed(true)
    setDismissed()
  }

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm"
            onClick={dismiss}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -12 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed inset-x-4 top-16 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:top-24 z-50 w-full sm:w-[460px]"
          >
            <div className="rounded-2xl border border-border/60 bg-background shadow-2xl p-6 relative">
              <button
                onClick={dismiss}
                aria-label="Close"
                className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors border-0 bg-transparent cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-base">Before you go —</h3>
                  <p className="text-xs text-muted-foreground">See what PlainPath can do in 60 seconds.</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                Drop any lease, offer letter, or confusing notice and get a plain-English breakdown of every risk and required action. No account needed.
              </p>

              <a
                href="/demo"
                onClick={dismiss}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all"
              >
                Try the free demo <ArrowRight className="w-4 h-4" />
              </a>
              <button
                onClick={dismiss}
                className="w-full mt-2.5 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors bg-transparent border-0 cursor-pointer"
              >
                No thanks, I'll figure it out myself
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
