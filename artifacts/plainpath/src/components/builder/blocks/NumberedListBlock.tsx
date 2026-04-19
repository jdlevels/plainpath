import { Plus, X } from "lucide-react";
import type { NumberedListPayload } from "@/lib/builderTypes";

interface Props {
  payload: NumberedListPayload;
  onChange: (p: NumberedListPayload) => void;
}

export function NumberedListBlock({ payload, onChange }: Props) {
  const items = payload.items ?? [""];
  const start = payload.start ?? 1;

  function updateItem(index: number, value: string) {
    const next = [...items];
    next[index] = value;
    onChange({ ...payload, items: next });
  }

  function addItem() {
    if (items.length >= 100) return;
    onChange({ ...payload, items: [...items, ""] });
  }

  function removeItem(index: number) {
    if (items.length === 1) return;
    onChange({ ...payload, items: items.filter((_, i) => i !== index) });
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
          <span className="text-muted-foreground text-sm shrink-0 w-6 text-right">
            {start + i}.
          </span>
          <input
            type="text"
            value={item}
            onChange={(e) => updateItem(i, e.target.value)}
            placeholder="List item"
            maxLength={2000}
            className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground/50"
          />
          {items.length > 1 && (
            <button
              onClick={() => removeItem(i)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
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
