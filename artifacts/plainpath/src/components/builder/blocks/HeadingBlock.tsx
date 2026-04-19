import type { HeadingPayload } from "@/lib/builderTypes";

interface Props {
  payload: HeadingPayload;
  onChange: (p: HeadingPayload) => void;
}

const LEVELS = [
  { value: 1, label: "H1" },
  { value: 2, label: "H2" },
  { value: 3, label: "H3" },
] as const;

export function HeadingBlock({ payload, onChange }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        {LEVELS.map((l) => (
          <button
            key={l.value}
            onClick={() => onChange({ ...payload, level: l.value })}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-colors ${
              payload.level === l.value
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>
      <input
        type="text"
        value={payload.text}
        onChange={(e) => onChange({ ...payload, text: e.target.value })}
        placeholder="Heading text"
        maxLength={300}
        className={`w-full bg-transparent border-none outline-none font-bold text-foreground placeholder:text-muted-foreground/50 ${
          payload.level === 1
            ? "text-2xl"
            : payload.level === 2
              ? "text-xl"
              : "text-lg"
        }`}
      />
    </div>
  );
}
