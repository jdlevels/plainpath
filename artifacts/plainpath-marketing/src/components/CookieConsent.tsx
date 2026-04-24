import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Cookie } from "lucide-react"

const CONSENT_KEY = "pp-cookies-accepted"

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(CONSENT_KEY)) return
    const t = setTimeout(() => setVisible(true), 1500)
    return () => clearTimeout(t)
  }, [])

  function accept() {
    localStorage.setItem(CONSENT_KEY, "1")
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-5 left-5 z-50 w-[calc(100%-2.5rem)] max-w-xs pointer-events-auto"
        >
          <div className="rounded-2xl border border-border/60 bg-background/96 backdrop-blur-lg shadow-xl p-4">
            <div className="flex items-start gap-2.5 mb-3.5">
              <Cookie className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">A small cookie notice</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We use cookies only to remember your theme preference. We don't track you, sell your data, or use advertising cookies.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={accept}
                className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer border-0"
              >
                Got it
              </button>
              <a
                href="/privacy"
                className="flex-1 py-2 rounded-xl bg-secondary text-secondary-foreground text-xs font-semibold text-center hover:bg-secondary/80 transition-colors"
              >
                Privacy policy
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
