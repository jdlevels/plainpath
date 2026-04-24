import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, X } from "lucide-react"
import { CHANGELOG, hasUnseenChanges, markChangelogSeen } from "@/data/changelog"

export function WhatsNew() {
  const [open, setOpen] = useState(false)
  const [unseen, setUnseen] = useState(() => hasUnseenChanges())

  function openModal() {
    setOpen(true)
    if (unseen) {
      markChangelogSeen()
      setUnseen(false)
    }
  }

  function close() { setOpen(false) }

  return (
    <>
      <button
        onClick={openModal}
        title="What's new in PlainPath"
        className="relative flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-lg hover:bg-secondary border-0 bg-transparent cursor-pointer"
      >
        <Sparkles className="w-3.5 h-3.5" />
        {unseen && (
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary ring-2 ring-background" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
              onClick={close}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="fixed top-[4.5rem] right-4 sm:right-6 z-50 w-[min(340px,calc(100vw-2rem))] max-h-[80dvh] overflow-y-auto"
            >
              <div className="rounded-2xl border border-border/60 bg-background shadow-2xl">
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/30">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <h2 className="font-bold text-sm text-foreground">What's new</h2>
                  </div>
                  <button
                    onClick={close}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors border-0 bg-transparent cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-5 space-y-5">
                  {CHANGELOG.map((entry, i) => (
                    <div key={entry.date}>
                      <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                        {i === 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-primary/10 text-primary uppercase tracking-wide leading-none">
                            Latest
                          </span>
                        )}
                        <span className="text-xs font-semibold text-muted-foreground">{entry.date}</span>
                        <span className="text-xs text-muted-foreground/60">·</span>
                        <span className="text-xs font-semibold text-foreground">{entry.title}</span>
                      </div>
                      <ul className="space-y-1.5">
                        {entry.items.map((item) => (
                          <li key={item} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                            <span className="mt-[5px] w-1 h-1 rounded-full bg-primary/50 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                      {i < CHANGELOG.length - 1 && (
                        <div className="mt-5 border-t border-border/25" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
