import { Plus, X } from "lucide-react";
import type { BulletListPayload } from "@/lib/builderTypes";

interface Props {
  payload: BulletListPayload;
  onChange: (p: BulletListPayload) => void;
}

export function BulletListBlock({ payload, onChange }: Props) {
  const items = payload.items ?? [""];

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
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 group">
          <span className="text-muted-foreground shrink-0 mt-0.5">•</span>
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
