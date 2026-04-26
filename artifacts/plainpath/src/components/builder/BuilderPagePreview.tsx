import React from "react";
import type { BuilderContent, BuilderSection, BuilderBlock, BrandingState } from "@/lib/builderTypes";
import { DEFAULT_BRANDING } from "@/lib/builderTypes";

// ─── Context ──────────────────────────────────────────────────────────────────

const BrandingCtx = React.createContext<BrandingState>(DEFAULT_BRANDING);
function useBranding() { return React.useContext(BrandingCtx); }

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  content: BuilderContent;
  title: string;
  selectedBlockId?: string | null;
  onBlockSelect?: (sectionId: string, blockId: string) => void;
  branding?: BrandingState | null;
}

// ─── Branded header ───────────────────────────────────────────────────────────

function BrandingHeader() {
  const b = useBranding();
  const hasLogo = !!b.logoDataUrl;
  const hasCompany = !!b.companyName.trim();
  const hasDept = !!b.departmentName.trim();
  if (!hasLogo && !hasCompany && !hasDept) return null;

  const color = b.brandColor || "#1d4ed8";

  // ── Formal: full-width colored block ───────────────────────────────────────
  if (b.headerStyle === "formal") {
    const logoEl = hasLogo && (
      <img
        src={b.logoDataUrl!}
        alt="logo"
        className="h-10 max-w-[120px] object-contain"
        style={{
          filter: "brightness(0) invert(1)",
          opacity: 0.9,
        }}
      />
    );
    return (
      <div
        className="mb-7 -mx-0 px-6 py-4 rounded-sm"
        style={{ backgroundColor: color }}
      >
        <div
          className={`flex items-center gap-4 ${
            b.logoPosition === "center"
              ? "flex-col text-center"
              : b.logoPosition === "right"
              ? "flex-row-reverse"
              : "flex-row"
          }`}
        >
          {hasLogo && logoEl}
          <div className={b.logoPosition === "center" ? "" : "flex-1"}>
            {hasCompany && (
              <p
                className="font-bold text-white text-base leading-tight"
                style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
              >
                {b.companyName}
              </p>
            )}
            {hasDept && (
              <p
                className="text-[12px] text-white/80 mt-0.5"
                style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
              >
                {b.departmentName}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Modern: left accent bar ────────────────────────────────────────────────
  if (b.headerStyle === "modern") {
    return (
      <div className="mb-7 flex items-start gap-4" style={{ borderLeft: `4px solid ${color}`, paddingLeft: "16px" }}>
        {hasLogo && b.logoPosition === "left" && (
          <img src={b.logoDataUrl!} alt="logo" className="h-9 max-w-[96px] object-contain shrink-0" />
        )}
        <div className="flex-1">
          {hasCompany && (
            <p
              className="font-bold text-neutral-900 text-sm leading-tight"
              style={{ fontFamily: "system-ui, -apple-system, sans-serif", color }}
            >
              {b.companyName}
            </p>
          )}
          {hasDept && (
            <p
              className="text-[12px] text-neutral-500 mt-0.5"
              style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
            >
              {b.departmentName}
            </p>
          )}
        </div>
        {hasLogo && b.logoPosition === "right" && (
          <img src={b.logoDataUrl!} alt="logo" className="h-9 max-w-[96px] object-contain shrink-0" />
        )}
      </div>
    );
  }

  // ── Internal: gray header with badge ──────────────────────────────────────
  if (b.headerStyle === "internal") {
    return (
      <div className="mb-7 px-4 py-3 rounded-sm bg-neutral-100 flex items-center gap-4">
        {hasLogo && b.logoPosition === "left" && (
          <img src={b.logoDataUrl!} alt="logo" className="h-8 max-w-[80px] object-contain shrink-0" />
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {hasCompany && (
              <p
                className="text-sm font-semibold text-neutral-700"
                style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
              >
                {b.companyName}
              </p>
            )}
            {hasDept && (
              <p className="text-[12px] text-neutral-500" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
                · {b.departmentName}
              </p>
            )}
          </div>
          <span
            className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mt-1 inline-block"
            style={{ backgroundColor: `${color}18`, color, border: `1px solid ${color}30` }}
          >
            Internal Use Only
          </span>
        </div>
        {hasLogo && b.logoPosition === "right" && (
          <img src={b.logoDataUrl!} alt="logo" className="h-8 max-w-[80px] object-contain shrink-0" />
        )}
      </div>
    );
  }

  // ── Minimal (default): company name + thin accent line ────────────────────
  return (
    <div
      className="mb-7 pb-3"
      style={{ borderBottom: `2px solid ${color}` }}
    >
      <div
        className={`flex items-center gap-3 ${
          b.logoPosition === "center"
            ? "justify-center flex-col text-center"
            : b.logoPosition === "right"
            ? "flex-row-reverse"
            : "flex-row"
        }`}
      >
        {hasLogo && (
          <img src={b.logoDataUrl!} alt="logo" className="h-8 max-w-[96px] object-contain shrink-0" />
        )}
        <div>
          {hasCompany && (
            <p
              className="text-[13px] font-semibold text-neutral-700"
              style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
            >
              {b.companyName}
            </p>
          )}
          {hasDept && (
            <p className="text-[11px] text-neutral-400" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
              {b.departmentName}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Branded footer ───────────────────────────────────────────────────────────

function BrandingFooter() {
  const b = useBranding();
  const hasFooter = b.footerText.trim() || b.showPageNumber || b.showConfidential || b.showRevisionLine;
  if (!hasFooter) return null;

  const color = b.brandColor || "#1d4ed8";
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div
      className="mt-10 pt-3"
      style={{ borderTop: `1px solid ${color}40` }}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          {b.footerText.trim() && (
            <p
              className="text-[11px] text-neutral-500 truncate"
              style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
            >
              {b.footerText}
            </p>
          )}
          {b.showRevisionLine && (
            <p className="text-[10px] text-neutral-400 mt-0.5" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
              Version 1.0 · {today}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {b.showConfidential && (
            <span
              className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${color}12`, color, border: `1px solid ${color}30` }}
            >
              Confidential
            </span>
          )}
          {b.showPageNumber && (
            <span className="text-[11px] text-neutral-400" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
              Page 1
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Watermark ────────────────────────────────────────────────────────────────

function Watermark() {
  const { watermarkEnabled, brandColor } = useBranding();
  if (!watermarkEnabled) return null;
  const color = brandColor || "#1d4ed8";
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden flex items-center justify-center"
      style={{ zIndex: 10 }}
    >
      <p
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: "72px",
          fontWeight: 900,
          color,
          opacity: 0.045,
          transform: "rotate(-35deg)",
          whiteSpace: "nowrap",
          userSelect: "none",
          letterSpacing: "0.15em",
        }}
      >
        CONFIDENTIAL
      </p>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export const BuilderPagePreview = React.memo(function BuilderPagePreview({
  content,
  title,
  selectedBlockId,
  onBlockSelect,
  branding,
}: Props) {
  const resolvedBranding = branding ?? DEFAULT_BRANDING;
  const sections = [...content.sections].sort((a, b) => a.order - b.order);

  return (
    <BrandingCtx.Provider value={resolvedBranding}>
      <div className="relative text-[14px] leading-relaxed text-neutral-900" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
        <Watermark />

        <BrandingHeader />

        {title && (
          <div className="mb-7 pb-5 border-b border-neutral-200">
            <h1
              style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
              className="text-2xl font-bold text-neutral-900 leading-tight"
            >
              {title}
            </h1>
          </div>
        )}

        {sections.length === 0 && !title && (
          <p className="text-neutral-400 text-sm italic text-center pt-24">
            Your document will appear here as you build it.
          </p>
        )}

        {sections.map((section) => (
          <PreviewSection
            key={section.id}
            section={section}
            selectedBlockId={selectedBlockId ?? null}
            onBlockSelect={onBlockSelect ?? null}
          />
        ))}

        <BrandingFooter />
      </div>
    </BrandingCtx.Provider>
  );
});

// ─── Section ──────────────────────────────────────────────────────────────────

function PreviewSection({
  section,
  selectedBlockId,
  onBlockSelect,
}: {
  section: BuilderSection;
  selectedBlockId: string | null;
  onBlockSelect: ((sectionId: string, blockId: string) => void) | null;
}) {
  const { brandColor } = useBranding();
  const color = brandColor || "#1d4ed8";
  const blocks = [...section.blocks].sort((a, b) => a.order - b.order);
  const hasContent = blocks.some((b) => hasVisibleContent(b));

  return (
    <div className="mb-8">
      {section.title && (
        <h2
          style={{
            fontFamily: "system-ui, -apple-system, sans-serif",
            borderBottomColor: `${color}50`,
          }}
          className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-4 pb-2 border-b"
        >
          {section.title}
        </h2>
      )}
      {hasContent ? (
        <div className="space-y-3">
          {blocks.map((block) => {
            const isSelected = selectedBlockId === block.id;
            const isClickable = !!onBlockSelect;
            return (
              <div
                key={block.id}
                onClick={isClickable ? () => onBlockSelect!(section.id, block.id) : undefined}
                className={[
                  "rounded transition-all",
                  isClickable ? "cursor-pointer" : "",
                  isSelected
                    ? "ring-2 ring-blue-500 ring-offset-2 bg-blue-50/40"
                    : isClickable
                    ? "hover:ring-1 hover:ring-blue-300 hover:ring-offset-1"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                title={isClickable ? "Click to edit this block" : undefined}
              >
                <PreviewBlock block={block} />
              </div>
            );
          })}
        </div>
      ) : (
        section.title && <div className="h-2" />
      )}
    </div>
  );
}

// ─── hasVisibleContent ────────────────────────────────────────────────────────

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

// ─── PreviewBlock ─────────────────────────────────────────────────────────────

function PreviewBlock({ block }: { block: BuilderBlock }) {
  const { brandColor } = useBranding();
  const color = brandColor || "#1d4ed8";
  const { type, payload } = block;

  if (type === "heading") {
    const p = payload as { text: string; level: number };
    if (!p.text?.trim()) return null;
    const level = Math.max(1, Math.min(6, p.level ?? 2));
    const sizeMap: Record<number, string> = {
      1: "text-xl font-bold mt-5 mb-2",
      2: "text-base font-bold mt-4 mb-1.5",
      3: "text-[15px] font-semibold mt-3 mb-1",
      4: "text-[14px] font-semibold mt-2 mb-1",
      5: "text-[13px] font-medium mt-2 mb-0.5",
      6: "text-[12px] font-medium mt-1 mb-0.5",
    };
    const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
    return (
      <Tag
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: level <= 2 ? color : undefined,
        }}
        className={`${sizeMap[level]} leading-snug`}
      >
        {p.text}
      </Tag>
    );
  }

  if (type === "paragraph") {
    const p = payload as { text: string };
    if (!p.text?.trim()) return null;
    return <p className="text-neutral-800 text-[14px] leading-[1.7]">{p.text}</p>;
  }

  if (type === "bullet-list") {
    const p = payload as { items: string[] };
    const items = (p.items ?? []).filter((i) => i.trim());
    if (!items.length) return null;
    return (
      <ul className="space-y-1 pl-4">
        {items.map((item, i) => (
          <li key={i} className="text-neutral-800 text-[14px] flex gap-2.5">
            <span className="text-neutral-500 select-none shrink-0 mt-px">•</span>
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
      <ol className="space-y-1 pl-4">
        {items.map((item, i) => (
          <li key={i} className="text-neutral-800 text-[14px] flex gap-2.5">
            <span className="text-neutral-500 select-none shrink-0 tabular-nums mt-px">{start + i}.</span>
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
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2.5 text-[14px]">
            <span
              className={`mt-[2px] w-4 h-4 rounded-sm border shrink-0 flex items-center justify-center text-[9px] font-bold ${
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
      <div className="space-y-2">
        {pairs.map((pair, i) => (
          <div key={i} className="flex gap-4 text-[14px]">
            <span
              style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
              className="font-semibold text-neutral-700 shrink-0 min-w-[112px]"
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
      info:    { box: "bg-blue-50 border-blue-300 text-blue-900",   label: "Note" },
      warning: { box: "bg-amber-50 border-amber-300 text-amber-900", label: "Warning" },
      tip:     { box: "bg-green-50 border-green-300 text-green-900", label: "Tip" },
    };
    const style = styles[p.variant ?? "info"] ?? styles["info"];
    return (
      <div className={`border-l-[3px] px-4 py-2.5 text-[13px] rounded-r ${style.box}`}>
        <span
          style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
          className="font-bold text-[10px] uppercase tracking-widest block mb-1 opacity-60"
        >
          {style.label}
        </span>
        {p.text}
      </div>
    );
  }

  if (type === "divider") {
    return (
      <hr
        className="my-2"
        style={{ borderColor: `${color}30` }}
      />
    );
  }

  if (type === "table") {
    const p = payload as { columns: string[]; rows: string[][]; has_header_row?: boolean };
    const cols = p.columns ?? [];
    if (!cols.length) return null;
    const rows = p.rows ?? [];
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12px]" style={{ borderColor: "#d1d5db" }}>
          <thead>
            <tr>
              {cols.map((col, c) => (
                <th
                  key={c}
                  className="border px-3 py-2 text-left font-semibold text-neutral-700 bg-neutral-50"
                  style={{ borderColor: "#d1d5db", fontFamily: "system-ui, -apple-system, sans-serif" }}
                >
                  {col || `Column ${c + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r} className={r % 2 === 1 ? "bg-neutral-50/60" : ""}>
                {cols.map((_, c) => (
                  <td
                    key={c}
                    className="border px-3 py-2 text-neutral-800"
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
                  className="border px-3 py-2.5 text-neutral-400 italic text-center"
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
