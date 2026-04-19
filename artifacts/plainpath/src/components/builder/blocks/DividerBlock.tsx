import type { DividerPayload } from "@/lib/builderTypes";

interface Props {
  payload: DividerPayload;
  onChange: (p: DividerPayload) => void;
}

export function DividerBlock({ payload, onChange }: Props) {
  const style = payload.style ?? "line";
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {(["line", "space"] as const).map((s) => (
          <button
            key={s}
            onClick={() => onChange({ style: s })}
            className={`px-2.5 py-1 text-xs rounded border transition-colors ${
              style === s
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-foreground"
            }`}
          >
            {s === "line" ? "Horizontal line" : "Spacing gap"}
          </button>
        ))}
      </div>
      <div className="pointer-events-none">
        {style === "line" ? (
          <hr className="border-border" />
        ) : (
          <div className="h-6" />
        )}
      </div>
    </div>
  );
}
