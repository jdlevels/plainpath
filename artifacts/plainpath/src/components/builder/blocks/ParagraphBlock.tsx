import { useEffect, useRef } from "react";
import type { ParagraphPayload } from "@/lib/builderTypes";

interface Props {
  payload: ParagraphPayload;
  onChange: (p: ParagraphPayload) => void;
}

export function ParagraphBlock({ payload, onChange }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = ref.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  }, [payload.text]);

  return (
    <textarea
      ref={ref}
      value={payload.text}
      onChange={(e) => onChange({ ...payload, text: e.target.value })}
      placeholder="Write your paragraph here…"
      maxLength={10000}
      rows={1}
      className="w-full bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/50 leading-relaxed overflow-hidden"
    />
  );
}
