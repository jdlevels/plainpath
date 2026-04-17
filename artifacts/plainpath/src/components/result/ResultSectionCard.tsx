import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Card } from "@/components/ui/card"

interface ResultSectionCardProps {
  icon: React.ElementType
  title: string
  defaultOpen?: boolean
  collapsible?: boolean
  badge?: React.ReactNode
  accentClass?: string
  className?: string
  children: React.ReactNode
}

export function ResultSectionCard({
  icon: Icon,
  title,
  defaultOpen = true,
  collapsible = true,
  badge,
  accentClass = "",
  className = "",
  children,
}: ResultSectionCardProps) {
  const [open, setOpen] = useState(defaultOpen)

  if (!collapsible) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card className={`p-5 border-border/40 ${accentClass} ${className}`}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
              <Icon className="w-3.5 h-3.5 text-primary/70" />
            </div>
            <h3 className="text-sm font-bold text-foreground">{title}</h3>
            {badge}
          </div>
          {children}
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={`border-border/40 overflow-hidden ${accentClass} ${className}`}>
        <button
          onClick={() => setOpen(v => !v)}
          className="w-full flex items-center gap-2 px-5 py-4 text-left hover:bg-secondary/30 transition-colors"
          style={{ touchAction: "manipulation" }}
        >
          <div className="w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
            <Icon className="w-3.5 h-3.5 text-primary/70" />
          </div>
          <h3 className="text-sm font-bold text-foreground flex-1 min-w-0">{title}</h3>
          {badge}
          {open
            ? <ChevronUp className="w-4 h-4 text-muted-foreground/50 shrink-0" />
            : <ChevronDown className="w-4 h-4 text-muted-foreground/50 shrink-0" />
          }
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5">
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
}
