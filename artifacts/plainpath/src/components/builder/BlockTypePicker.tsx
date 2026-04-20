import { useState, useRef, useEffect } from "react";
import {
  Heading, AlignLeft, List, ListOrdered, CheckSquare,
  Columns2, Minus, MessageSquare, Table, Plus,
} from "lucide-react";
import type { KnownBlockType } from "@/lib/builderTypes";

const BLOCK_TYPES: Array<{
  type: KnownBlockType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { type: "heading",       label: "Heading",        icon: Heading       },
  { type: "paragraph",     label: "Paragraph",      icon: AlignLeft     },
  { type: "bullet-list",   label: "Bullet List",    icon: List          },
  { type: "numbered-list", label: "Numbered List",  icon: ListOrdered   },
  { type: "checklist",     label: "Checklist",      icon: CheckSquare   },
  { type: "key-value",     label: "Key-Value",      icon: Columns2      },
  { type: "divider",       label: "Divider",        icon: Minus         },
  { type: "note",          label: "Note / Callout", icon: MessageSquare },
  { type: "table",         label: "Table",          icon: Table         },
];

interface PickerProps {
  onSelect: (type: KnownBlockType) => void;
  onClose: () => void;
}

function BlockTypeMenu({ onSelect, onClose }: PickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute z-[200] top-full mt-2 left-0 w-52 rounded-xl border border-border/60 bg-background shadow-lg py-1 overflow-hidden"
    >
      <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
        Block type
      </p>
      {BLOCK_TYPES.map(({ type, label, icon: Icon }) => (
        <button
          key={type}
          onClick={() => { onSelect(type); onClose(); }}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors text-left"
        >
          <Icon className="w-3.5 h-3.5 shrink-0" />
          {label}
        </button>
      ))}
    </div>
  );
}

interface AddBlockButtonProps {
  onSelect: (type: KnownBlockType) => void;
}

export function AddBlockButton({ onSelect }: AddBlockButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-dashed border-border hover:border-foreground/40 rounded-lg px-3 py-1.5 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Add block
      </button>
      {open && (
        <BlockTypeMenu onSelect={onSelect} onClose={() => setOpen(false)} />
      )}
    </div>
  );
}
