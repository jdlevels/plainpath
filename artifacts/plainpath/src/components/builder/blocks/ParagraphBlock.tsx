import type { ParagraphPayload } from "@/lib/builderTypes";

interface Props {
  payload: ParagraphPayload;
  onChange: (p: ParagraphPayload) => void;
}

export function ParagraphBlock({ payload, onChange }: Props) {
  return (
    <textarea
      value={payload.text}
      onChange={(e) => onChange({ ...payload, text: e.target.value })}
      placeholder="Write your paragraph here…"
      maxLength={10000}
      rows={3}
      className="w-full bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/50 leading-relaxed"
    />
  );
}
