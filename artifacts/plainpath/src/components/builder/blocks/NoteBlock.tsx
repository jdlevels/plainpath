import type { NotePayload } from "@/lib/builderTypes";

interface Props {
  payload: NotePayload;
  onChange: (p: NotePayload) => void;
}

const VARIANT_STYLES = {
  info: "border-blue-500/40 bg-blue-50/60 dark:bg-blue-950/30 dark:border-blue-500/30",
  warning: "border-amber-500/40 bg-amber-50/60 dark:bg-amber-950/30 dark:border-amber-500/30",
  tip: "border-green-500/40 bg-green-50/60 dark:bg-green-950/30 dark:border-green-500/30",
};

const VARIANT_LABELS = { info: "Info", warning: "Warning", tip: "Tip" };

export function NoteBlock({ payload, onChange }: Props) {
  const variant = payload.variant ?? "info";
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        {(["info", "warning", "tip"] as const).map((v) => (
          <button
            key={v}
            onClick={() => onChange({ ...payload, variant: v })}
            className={`px-2.5 py-1 text-xs rounded border transition-colors ${
              variant === v
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-foreground"
            }`}
          >
            {VARIANT_LABELS[v]}
          </button>
        ))}
      </div>
      <div className={`rounded-lg border-l-4 p-3 ${VARIANT_STYLES[variant]}`}>
        <textarea
          value={payload.text}
          onChange={(e) => onChange({ ...payload, text: e.target.value })}
          placeholder="Note text…"
          maxLength={5000}
          rows={2}
          className="w-full bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/50 leading-relaxed"
        />
      </div>
    </div>
  );
}
