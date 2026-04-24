import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useUser } from "@clerk/react"
import { useLocation } from "wouter"
import { FileScan, ShieldCheck, EyeOff, ArrowRight, X, Sparkles } from "lucide-react"

const ONBOARD_KEY = "pp-onboarded-v1"

const FIRST_STEPS = [
  {
    icon: FileScan,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    title: "Analyze a Document",
    desc: "Upload any lease, contract, letter, or bill. Get a plain-English breakdown of every key term, deadline, and risk.",
    href: "/analyze",
  },
  {
    icon: ShieldCheck,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    title: "Document Trust Check",
    desc: "Not sure if a letter or notice is legitimate? Run a trust check to spot fraud signals instantly.",
    href: "/import?mode=trust-check",
  },
  {
    icon: EyeOff,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    title: "Redact Sensitive Info",
    desc: "Remove SSNs, account numbers, and personal data before sharing any document.",
    href: "/redact",
  },
]

export function FirstRunOnboarding() {
  const { isLoaded, isSignedIn, user } = useUser()
  const [, navigate] = useLocation()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    if (localStorage.getItem(ONBOARD_KEY)) return
    const t = setTimeout(() => setShow(true), 900)
    return () => clearTimeout(t)
  }, [isLoaded, isSignedIn])

  function dismiss() {
    localStorage.setItem(ONBOARD_KEY, "1")
    setShow(false)
  }

  function go(href: string) {
    localStorage.setItem(ONBOARD_KEY, "1")
    setShow(false)
    navigate(href)
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
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={dismiss}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed inset-x-4 bottom-4 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:top-1/2 sm:-translate-y-1/2 z-50 w-full sm:w-[460px] max-h-[90dvh] overflow-y-auto"
          >
            <div className="rounded-2xl border border-border/60 bg-background shadow-2xl p-6">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="text-xs font-semibold text-primary uppercase tracking-wide">Getting started</span>
                  </div>
                  <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                    Welcome{user?.firstName ? `, ${user.firstName}` : " to PlainPath"}!
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    What would you like to do first?
                  </p>
                </div>
                <button
                  onClick={dismiss}
                  aria-label="Close"
                  className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors border-0 bg-transparent cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {FIRST_STEPS.map(({ icon: Icon, color, bg, title, desc, href }) => (
                  <button
                    key={href}
                    onClick={() => go(href)}
                    className="w-full text-left flex items-start gap-3.5 p-3.5 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-secondary/30 transition-all group"
                  >
                    <div className={`p-2 rounded-xl ${bg} shrink-0 mt-0.5`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {desc}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0 mt-1" />
                  </button>
                ))}
              </div>

              <button
                onClick={dismiss}
                className="w-full mt-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors bg-transparent border-0 cursor-pointer"
              >
                I'll explore on my own
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
