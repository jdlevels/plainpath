import React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { Info } from "lucide-react"
import { cn } from "@/lib/utils"

export function EvidenceTooltip({ text, className }: { text?: string, className?: string }) {
  if (!text) return null;

  return (
    <TooltipPrimitive.Provider delayDuration={200}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          <button className={cn("text-muted-foreground hover:text-primary transition-colors focus:outline-none rounded-full p-1 hover:bg-secondary", className)}>
            <Info className="h-4 w-4" />
            <span className="sr-only">Source Evidence</span>
          </button>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            className="z-50 max-w-sm overflow-hidden rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground shadow-xl animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
            sideOffset={4}
          >
            <div className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-1">Source Evidence</div>
            <p className="leading-relaxed italic text-muted-foreground">"{text}"</p>
            <TooltipPrimitive.Arrow className="fill-white drop-shadow-sm" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}
