interface ResultMetaStripItem {
  icon: React.ElementType
  text: string
}

interface ResultMetaStripProps {
  items: ResultMetaStripItem[]
  className?: string
}

export function ResultMetaStrip({ items, className = "" }: ResultMetaStripProps) {
  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground/60 px-1 ${className}`}>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          <item.icon className="w-3 h-3" />
          {item.text}
        </span>
      ))}
    </div>
  )
}
