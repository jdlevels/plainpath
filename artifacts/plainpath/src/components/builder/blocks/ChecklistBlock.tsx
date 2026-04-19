import { Plus, X } from "lucide-react";
import type { ChecklistPayload } from "@/lib/builderTypes";

interface Props {
  payload: ChecklistPayload;
  onChange: (p: ChecklistPayload) => void;
}

export function ChecklistBlock({ payload, onChange }: Props) {
  const items = payload.items ?? [{ text: "", checked: false }];

  function updateItem(index: number, updates: Partial<{ text: string; checked: boolean }>) {
    const next = items.map((item, i) => (i === index ? { ...item, ...updates } : item));
    onChange({ ...payload, items: next });
  }

  function addItem() {
    if (items.length >= 100) return;
    onChange({ ...payload, items: [...items, { text: "", checked: false }] });
  }

  function removeItem(index: number) {
    if (items.length === 1) return;
    onChange({ ...payload, items: items.filter((_, i) => i !== index) });
  }

  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 group">
          <input
            type="checkbox"
            checked={item.checked}
            onChange={(e) => updateItem(i, { checked: e.target.checked })}
            className="w-4 h-4 rounded border-border accent-primary shrink-0"
          />
          <input
            type="text"
            value={item.text}
            onChange={(e) => updateItem(i, { text: e.target.value })}
            placeholder="Checklist item"
            maxLength={2000}
            className={`flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/50 ${
              item.checked ? "line-through text-muted-foreground" : "text-foreground"
            }`}
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
