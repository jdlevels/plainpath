import { Plus, X } from "lucide-react";
import type { KeyValuePayload } from "@/lib/builderTypes";

interface Props {
  payload: KeyValuePayload;
  onChange: (p: KeyValuePayload) => void;
}

export function KeyValueBlock({ payload, onChange }: Props) {
  const pairs = payload.pairs ?? [{ key: "", value: "" }];
  const layout = payload.layout ?? "two-column";

  function updatePair(index: number, updates: Partial<{ key: string; value: string }>) {
    const next = pairs.map((pair, i) => (i === index ? { ...pair, ...updates } : pair));
    onChange({ ...payload, pairs: next });
  }

  function addPair() {
    if (pairs.length >= 30) return;
    onChange({ ...payload, pairs: [...pairs, { key: "", value: "" }] });
  }

  function removePair(index: number) {
    if (pairs.length === 1) return;
    onChange({ ...payload, pairs: pairs.filter((_, i) => i !== index) });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Layout:</span>
        {(["two-column", "stacked"] as const).map((l) => (
          <button
            key={l}
            onClick={() => onChange({ ...payload, layout: l })}
            className={`px-2 py-0.5 text-xs rounded border transition-colors ${
              layout === l
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-foreground"
            }`}
          >
            {l === "two-column" ? "Two column" : "Stacked"}
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        {pairs.map((pair, i) => (
          <div key={i} className={`group flex gap-2 ${layout === "stacked" ? "flex-col" : "items-center"}`}>
            <input
              type="text"
              value={pair.key}
              onChange={(e) => updatePair(i, { key: e.target.value })}
              placeholder="Key"
              maxLength={100}
              className={`bg-transparent border-none outline-none text-sm font-medium text-foreground placeholder:text-muted-foreground/50 ${
                layout === "two-column" ? "w-1/3" : "w-full"
              }`}
            />
            {layout === "two-column" && (
              <span className="text-muted-foreground/50 shrink-0">→</span>
            )}
            <input
              type="text"
              value={pair.value}
              onChange={(e) => updatePair(i, { value: e.target.value })}
              placeholder="Value"
              maxLength={1000}
              className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground/50"
            />
            {pairs.length > 1 && (
              <button
                onClick={() => removePair(i)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {pairs.length < 30 && (
        <button
          onClick={addPair}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add pair
        </button>
      )}
    </div>
  );
}
