import React from "react";
import type { BuilderContent, BuilderSection, BuilderBlock } from "@/lib/builderTypes";

interface Props {
  content: BuilderContent;
  title: string;
}

export const BuilderPagePreview = React.memo(function BuilderPagePreview({ content, title }: Props) {
  const sections = [...content.sections].sort((a, b) => a.order - b.order);

  return (
    <div className="text-[13px] leading-relaxed text-neutral-900" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
      {title && (
        <div className="mb-6 pb-5 border-b border-neutral-200">
          <h1 style={{ fontFamily: "system-ui, -apple-system, sans-serif" }} className="text-xl font-bold text-neutral-900 leading-tight">
            {title}
          </h1>
        </div>
      )}

      {sections.length === 0 && !title && (
        <p className="text-neutral-400 text-xs italic text-center pt-20">
          Your document will appear here as you build it.
        </p>
      )}

      {sections.map((section) => (
        <PreviewSection key={section.id} section={section} />
      ))}
    </div>
  );
});

function PreviewSection({ section }: { section: BuilderSection }) {
  const blocks = [...section.blocks].sort((a, b) => a.order - b.order);
  const hasContent = blocks.some((b) => hasVisibleContent(b));

  return (
    <div className="mb-7">
      {section.title && (
        <h2
          style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
          className="text-[13px] font-semibold text-neutral-800 uppercase tracking-wide mb-3 pb-1.5 border-b border-neutral-150"
        >
          {section.title}
        </h2>
      )}
      {hasContent ? (
        <div className="space-y-2.5">
          {blocks.map((block) => (
            <PreviewBlock key={block.id} block={block} />
          ))}
        </div>
      ) : (
        section.title && <div className="h-2" />
      )}
    </div>
  );
}

function hasVisibleContent(block: BuilderBlock): boolean {
  const { type, payload } = block;
  const p = payload as Record<string, unknown>;
  if (type === "heading" || type === "paragraph" || type === "note") {
    return typeof p.text === "string" && p.text.trim().length > 0;
  }
  if (type === "bullet-list" || type === "numbered-list") {
    return Array.isArray(p.items) && (p.items as string[]).some((i) => i.trim());
  }
  if (type === "checklist") {
    return (
      Array.isArray(p.items) &&
      (p.items as Array<{ text: string }>).some((i) => i.text.trim())
    );
  }
  if (type === "key-value") {
    return (
      Array.isArray(p.pairs) &&
      (p.pairs as Array<{ key: string; value: string }>).some(
        (pair) => pair.key.trim() || pair.value.trim()
      )
    );
  }
  if (type === "table") {
    return Array.isArray(p.columns) && (p.columns as string[]).length > 0;
  }
  if (type === "divider") return true;
  return false;
}

function PreviewBlock({ block }: { block: BuilderBlock }) {
  const { type, payload } = block;

  if (type === "heading") {
    const p = payload as { text: string; level: number };
    if (!p.text?.trim()) return null;
    const level = Math.max(1, Math.min(6, p.level ?? 2));
    const sizeMap: Record<number, string> = {
      1: "text-base font-bold mt-4 mb-1",
      2: "text-[13px] font-bold mt-3 mb-1",
      3: "text-[13px] font-semibold mt-2 mb-0.5",
      4: "text-[12px] font-semibold mt-2 mb-0.5",
      5: "text-[12px] font-medium mt-1 mb-0",
      6: "text-[11px] font-medium mt-1 mb-0",
    };
    const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
    return (
      <Tag
        style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
        className={`${sizeMap[level]} text-neutral-900 leading-snug`}
      >
        {p.text}
      </Tag>
    );
  }

  if (type === "paragraph") {
    const p = payload as { text: string };
    if (!p.text?.trim()) return null;
    return <p className="text-neutral-800 text-[13px] leading-relaxed">{p.text}</p>;
  }

  if (type === "bullet-list") {
    const p = payload as { items: string[] };
    const items = (p.items ?? []).filter((i) => i.trim());
    if (!items.length) return null;
    return (
      <ul className="space-y-0.5 pl-4">
        {items.map((item, i) => (
          <li key={i} className="text-neutral-800 text-[13px] flex gap-2">
            <span className="text-neutral-500 select-none shrink-0">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (type === "numbered-list") {
    const p = payload as { items: string[]; start?: number };
    const items = (p.items ?? []).filter((i) => i.trim());
    if (!items.length) return null;
    const start = p.start ?? 1;
    return (
      <ol className="space-y-0.5 pl-4">
        {items.map((item, i) => (
          <li key={i} className="text-neutral-800 text-[13px] flex gap-2">
            <span className="text-neutral-500 select-none shrink-0 tabular-nums">{start + i}.</span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    );
  }

  if (type === "checklist") {
    const p = payload as { items: Array<{ text: string; checked: boolean }> };
    const items = (p.items ?? []).filter((i) => i.text.trim());
    if (!items.length) return null;
    return (
      <div className="space-y-1">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2 text-[13px]">
            <span
              className={`mt-[1px] w-3.5 h-3.5 rounded-sm border shrink-0 flex items-center justify-center text-[9px] font-bold ${
                item.checked
                  ? "bg-neutral-700 border-neutral-700 text-white"
                  : "border-neutral-400"
              }`}
            >
              {item.checked ? "✓" : ""}
            </span>
            <span className={item.checked ? "line-through text-neutral-400" : "text-neutral-800"}>
              {item.text}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (type === "key-value") {
    const p = payload as { pairs: Array<{ key: string; value: string }> };
    const pairs = (p.pairs ?? []).filter((pair) => pair.key.trim() || pair.value.trim());
    if (!pairs.length) return null;
    return (
      <div className="space-y-1.5">
        {pairs.map((pair, i) => (
          <div key={i} className="flex gap-3 text-[13px]">
            <span
              style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
              className="font-semibold text-neutral-700 shrink-0 min-w-[96px]"
            >
              {pair.key}
            </span>
            <span className="text-neutral-800">{pair.value}</span>
          </div>
        ))}
      </div>
    );
  }

  if (type === "note") {
    const p = payload as { text: string; variant?: string };
    if (!p.text?.trim()) return null;
    const styles: Record<string, { box: string; label: string }> = {
      info:    { box: "bg-blue-50 border-blue-200 text-blue-900",   label: "Note" },
      warning: { box: "bg-amber-50 border-amber-200 text-amber-900", label: "Warning" },
      tip:     { box: "bg-green-50 border-green-200 text-green-900", label: "Tip" },
    };
    const style = styles[p.variant ?? "info"] ?? styles["info"];
    return (
      <div className={`border-l-2 px-3 py-2 text-[12px] rounded-r ${style.box}`}>
        <span
          style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
          className="font-semibold text-[11px] uppercase tracking-wide block mb-0.5 opacity-70"
        >
          {style.label}
        </span>
        {p.text}
      </div>
    );
  }

  if (type === "divider") {
    return <hr className="border-neutral-200 my-1" />;
  }

  if (type === "table") {
    const p = payload as { columns: string[]; rows: string[][]; has_header_row?: boolean };
    const cols = p.columns ?? [];
    if (!cols.length) return null;
    const rows = p.rows ?? [];
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[11px]" style={{ borderColor: "#d1d5db" }}>
          <thead>
            <tr>
              {cols.map((col, c) => (
                <th
                  key={c}
                  className="border px-2 py-1.5 text-left font-semibold text-neutral-700 bg-neutral-50"
                  style={{ borderColor: "#d1d5db", fontFamily: "system-ui, -apple-system, sans-serif" }}
                >
                  {col || `Column ${c + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r} className={r % 2 === 1 ? "bg-neutral-50" : ""}>
                {cols.map((_, c) => (
                  <td
                    key={c}
                    className="border px-2 py-1.5 text-neutral-800"
                    style={{ borderColor: "#d1d5db" }}
                  >
                    {row[c] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={cols.length}
                  className="border px-2 py-2 text-neutral-400 italic text-center"
                  style={{ borderColor: "#d1d5db" }}
                >
                  No rows yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  return null;
}
