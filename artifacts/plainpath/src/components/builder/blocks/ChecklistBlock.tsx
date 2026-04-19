import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import type { ChecklistPayload } from "@/lib/builderTypes";

interface Props {
  payload: ChecklistPayload;
  onChange: (p: ChecklistPayload) => void;
}

export function ChecklistBlock({ payload, onChange }: Props) {
  const items = payload.items ?? [{ text: "", checked: false }];
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusIdx, setFocusIdx] = useState<number | null>(null);

  useEffect(() => {
    if (focusIdx !== null && inputRefs.current[focusIdx]) {
      inputRefs.current[focusIdx]?.focus();
      setFocusIdx(null);
    }
  }, [focusIdx, items.length]);

  function updateItem(index: number, updates: Partial<{ text: string; checked: boolean }>) {
    const next = items.map((item, i) => (i === index ? { ...item, ...updates } : item));
    onChange({ ...payload, items: next });
  }

  function addItemAt(afterIndex: number) {
    if (items.length >= 100) return;
    const next = [...items];
    next.splice(afterIndex + 1, 0, { text: "", checked: false });
    onChange({ ...payload, items: next });
    setFocusIdx(afterIndex + 1);
  }

  function addItem() {
    addItemAt(items.length - 1);
  }

  function removeItem(index: number) {
    if (items.length === 1) {
      updateItem(0, { text: "" });
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
    } else if (e.key === "Backspace" && items[index].text === "" && items.length > 1) {
      e.preventDefault();
      removeItem(index);
    }
  }

  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 group">
          <input
            type="checkbox"
            checked={item.checked}
            onChange={(e) => updateItem(i, { checked: e.target.checked })}
            className="w-4 h-4 rounded border-border accent-primary shrink-0 cursor-pointer"
          />
          <input
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            value={item.text}
            onChange={(e) => updateItem(i, { text: e.target.value })}
            onKeyDown={(e) => handleKeyDown(e, i)}
            placeholder="Checklist item"
            maxLength={2000}
            className={`flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/50 ${
              item.checked ? "line-through text-muted-foreground" : "text-foreground"
            }`}
          />
          <button
            onClick={() => removeItem(i)}
            title="Remove item"
            className={`transition-opacity text-muted-foreground hover:text-destructive ${
              items.length === 1 && item.text === "" ? "opacity-0 pointer-events-none" : "opacity-0 group-hover:opacity-100"
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
