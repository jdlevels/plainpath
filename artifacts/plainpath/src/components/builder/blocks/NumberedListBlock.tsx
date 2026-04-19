import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import type { NumberedListPayload } from "@/lib/builderTypes";

interface Props {
  payload: NumberedListPayload;
  onChange: (p: NumberedListPayload) => void;
}

export function NumberedListBlock({ payload, onChange }: Props) {
  const items = payload.items ?? [""];
  const start = payload.start ?? 1;
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusIdx, setFocusIdx] = useState<number | null>(null);

  useEffect(() => {
    if (focusIdx !== null && inputRefs.current[focusIdx]) {
      inputRefs.current[focusIdx]?.focus();
      setFocusIdx(null);
    }
  }, [focusIdx, items.length]);

  function updateItem(index: number, value: string) {
    const next = [...items];
    next[index] = value;
    onChange({ ...payload, items: next });
  }

  function addItemAt(afterIndex: number) {
    if (items.length >= 100) return;
    const next = [...items];
    next.splice(afterIndex + 1, 0, "");
    onChange({ ...payload, items: next });
    setFocusIdx(afterIndex + 1);
  }

  function addItem() {
    addItemAt(items.length - 1);
  }

  function removeItem(index: number) {
    if (items.length === 1) {
      updateItem(0, "");
      return;
    }
    const next = items.filter((_, i) => i !== index);
    onChange({ ...payload, items: next });
    setFocusIdx(Math.max(0, index - 1));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, index: number) {
    if (e.key === "Enter") {
      e.preventDefault();
      addItemAt(index);
    } else if (e.key === "Backspace" && items[index] === "" && items.length > 1) {
      e.preventDefault();
      removeItem(index);
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-muted-foreground">Start at:</span>
        <input
          type="number"
          value={start}
          min={1}
          onChange={(e) =>
            onChange({ ...payload, start: Math.max(1, parseInt(e.target.value) || 1) })
          }
          className="w-16 px-1.5 py-0.5 text-xs border border-border rounded bg-background text-foreground"
        />
      </div>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 group">
          <span className="text-muted-foreground text-sm shrink-0 w-6 text-right select-none">
            {start + i}.
          </span>
          <input
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            value={item}
            onChange={(e) => updateItem(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            placeholder="List item"
            maxLength={2000}
            className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground/50"
          />
          <button
            onClick={() => removeItem(i)}
            title="Remove item"
            className={`transition-opacity text-muted-foreground hover:text-destructive ${
              items.length === 1 && item === "" ? "opacity-0 pointer-events-none" : "opacity-0 group-hover:opacity-100"
            }`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      {items.length < 100 && (
        <button
          onClick={addItem}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1"
        >
          <Plus className="w-3.5 h-3.5" /> Add item
        </button>
      )}
    </div>
  );
}
