import React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { Quote } from "lucide-react"
import { cn } from "@/lib/utils"

interface EvidenceTooltipProps {
  text?: string
  className?: string
  inline?: boolean
}

export function EvidenceTooltip({ text, className, inline = true }: EvidenceTooltipProps) {
  if (!text) return null

  const snippet = text.length > 90 ? text.slice(0, 90).trimEnd() + "…" : text

  return (
    <TooltipPrimitive.Provider delayDuration={150}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          <button
            className={cn(
              "group flex items-start gap-1.5 text-left focus:outline-none rounded-lg transition-colors w-full",
              className
            )}
          >
            <Quote className="w-3 h-3 text-muted-foreground/40 mt-0.5 shrink-0 group-hover:text-primary/50 transition-colors" />
            <span className="text-[11px] text-muted-foreground/50 italic leading-relaxed group-hover:text-muted-foreground/70 transition-colors truncate">
              {snippet}
            </span>
          </button>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            className="z-50 w-[340px] overflow-hidden rounded-xl border border-border bg-white px-4 py-3.5 shadow-xl animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
            sideOffset={6}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">From the source document</p>
            <div className="flex items-start gap-2">
              <Quote className="w-3.5 h-3.5 text-primary/40 mt-0.5 shrink-0" />
              <p className="text-sm text-foreground/80 leading-relaxed italic">"{text}"</p>
            </div>
            <TooltipPrimitive.Arrow className="fill-white drop-shadow-sm" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}
