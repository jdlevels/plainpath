import React, { useState, useRef, useEffect } from "react";
import { Plus, Trash2, Copy as CopyIcon, Sparkles, ChevronDown } from "lucide-react";
import type {
  BuilderContent,
  BuilderSection,
  BuilderBlock,
  BrandingState,
  FreeformField,
} from "@/lib/builderTypes";
import { DEFAULT_BRANDING } from "@/lib/builderTypes";

// ─── Snap grid ────────────────────────────────────────────────────────────────

const GRID = 8;
function snapToGrid(v: number, g = GRID) { return Math.round(v / g) * g; }

// ─── Context ──────────────────────────────────────────────────────────────────

const BrandingCtx = React.createContext<BrandingState>(DEFAULT_BRANDING);
function useBranding() { return React.useContext(BrandingCtx); }

// ─── Inline edit state ────────────────────────────────────────────────────────

interface InlineEditState {
  sectionId: string;
  blockId: string;
  text: string;
  blockType: string;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  content: BuilderContent;
  title: string;
  selectedBlockId?: string | null;
  onBlockSelect?: (sectionId: string, blockId: string) => void;
  branding?: BrandingState | null;
  onBlockInlineEdit?: (sectionId: string, blockId: string, newPayload: Record<string, unknown>) => void;
  onBlockDuplicate?: (sectionId: string, blockId: string) => void;
  onBlockDelete?: (sectionId: string, blockId: string) => void;
  onBlockAiGuide?: (sectionId: string, blockId: string) => void;
  onAddBlockToSection?: (sectionId: string, type: string) => void;
  freeformFields?: FreeformField[];
  selectedFreeformId?: string | null;
  onFreeformSelect?: (id: string | null) => void;
  onFreeformChange?: (field: FreeformField) => void;
  onFreeformAdd?: () => void;
  onFreeformDelete?: (id: string) => void;
  onFreeformDuplicate?: (id: string) => void;
}

// ─── Inline textarea (for structured block editing on the page) ───────────────

function InlineTextarea({
  text,
  blockType,
  brandColor,
  onCommit,
  onCancel,
}: {
  text: string;
  blockType: string;
  brandColor: string;
  onCommit: (newText: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(text);
  const ref = useRef<HTMLTextAreaElement>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    el.selectionStart = el.selectionEnd = el.value.length;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, []);

  const sizeClass =
    blockType === "heading"
      ? "text-xl font-bold leading-tight"
      : blockType === "note"
      ? "text-[13px]"
      : "text-[14px] leading-[1.7]";

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => {
        setValue(e.target.value);
        const el = e.target;
        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";
      }}
      onBlur={() => {
        if (!cancelledRef.current) onCommit(value);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          cancelledRef.current = true;
          onCancel();
        }
        if (e.key === "Enter" && (blockType === "heading" || e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          cancelledRef.current = true;
          onCommit(value);
        }
      }}
      className={`w-full resize-none border-0 outline-none rounded px-1 -mx-1 ${sizeClass}`}
      style={{
        fontFamily:
          blockType === "heading"
            ? "system-ui, -apple-system, sans-serif"
            : "Georgia, 'Times New Roman', serif",
        color: blockType === "heading" ? brandColor : undefined,
        background: "rgba(219,234,254,0.25)",
        boxShadow: "0 0 0 2px #3b82f6",
        minHeight: "24px",
      }}
    />
  );
}

// ─── Freeform field card ──────────────────────────────────────────────────────

function FreeformFieldCard({
  field,
  isSelected,
  onSelect,
  onChange,
  onDelete,
  onDuplicate,
}: {
  field: FreeformField;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onChange: (updated: FreeformField) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [resizeSize, setResizeSize] = useState<{ w: number; h: number } | null>(null);

  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);
  const dragOriginRef = useRef({ mouseX: 0, mouseY: 0, fx: 0, fy: 0 });
  const resizeOriginRef = useRef({ mouseX: 0, mouseY: 0, fw: 0, fh: 0 });
  const fieldRef = useRef(field);
  const onChangeRef = useRef(onChange);
  const dragPosLive = useRef<{ x: number; y: number } | null>(null);
  const resizeSizeLive = useRef<{ w: number; h: number } | null>(null);

  useEffect(() => { fieldRef.current = field; }, [field]);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        const nx = Math.max(0, dragOriginRef.current.fx + e.clientX - dragOriginRef.current.mouseX);
        const ny = Math.max(0, dragOriginRef.current.fy + e.clientY - dragOriginRef.current.mouseY);
        dragPosLive.current = { x: nx, y: ny };
        setDragPos({ x: nx, y: ny });
      }
      if (isResizingRef.current) {
        const nw = Math.max(80, resizeOriginRef.current.fw + e.clientX - resizeOriginRef.current.mouseX);
        const nh = Math.max(40, resizeOriginRef.current.fh + e.clientY - resizeOriginRef.current.mouseY);
        resizeSizeLive.current = { w: nw, h: nh };
        setResizeSize({ w: nw, h: nh });
      }
    };
    const onUp = () => {
      if (isDraggingRef.current && dragPosLive.current) {
        onChangeRef.current({
          ...fieldRef.current,
          x: snapToGrid(Math.max(0, dragPosLive.current.x)),
          y: snapToGrid(Math.max(0, dragPosLive.current.y)),
        });
        dragPosLive.current = null;
        setDragPos(null);
      }
      if (isResizingRef.current && resizeSizeLive.current) {
        onChangeRef.current({
          ...fieldRef.current,
          width: snapToGrid(Math.max(80, resizeSizeLive.current.w)),
          height: snapToGrid(Math.max(40, resizeSizeLive.current.h)),
        });
        resizeSizeLive.current = null;
        setResizeSize(null);
      }
      isDraggingRef.current = false;
      isResizingRef.current = false;
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, []);

  const displayX = dragPos?.x ?? field.x;
  const displayY = dragPos?.y ?? field.y;
  const displayW = resizeSize?.w ?? field.width;
  const displayH = resizeSize?.h ?? field.height;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect(field.id);
    isDraggingRef.current = true;
    dragOriginRef.current = { mouseX: e.clientX, mouseY: e.clientY, fx: field.x, fy: field.y };
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isResizingRef.current = true;
    resizeOriginRef.current = { mouseX: e.clientX, mouseY: e.clientY, fw: field.width, fh: field.height };
  };

  return (
    <div
      style={{
        position: "absolute",
        left: displayX,
        top: displayY,
        width: displayW,
        minHeight: displayH,
        zIndex: 5,
        cursor: isDraggingRef.current ? "grabbing" : "grab",
        userSelect: "none",
      }}
      className={[
        "rounded-md bg-white/95 shadow-sm transition-shadow",
        isSelected
          ? "ring-2 ring-blue-500 ring-offset-1 shadow-md"
          : "border border-neutral-200/80 hover:border-blue-300/60 hover:shadow-md",
      ].join(" ")}
      onMouseDown={handleMouseDown}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (!isEditing) {
          onSelect(field.id);
          setIsEditing(true);
        }
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(field.id);
      }}
    >
      {/* Mini-toolbar (above card, visible when selected and not editing) */}
      {isSelected && !isEditing && (
        <div
          style={{ position: "absolute", top: -32, left: 0, zIndex: 7, whiteSpace: "nowrap" }}
          className="flex items-center gap-1 bg-neutral-800 rounded-md px-1.5 py-1 shadow-lg"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <span className="text-[10px] text-neutral-300 font-medium px-1 select-none">Text Box</span>
          <div className="w-px h-3 bg-neutral-600 mx-0.5" />
          <button
            type="button"
            title="Duplicate"
            onClick={(e) => { e.stopPropagation(); onDuplicate(field.id); }}
            className="p-1 text-neutral-300 hover:text-white rounded transition-colors"
          >
            <CopyIcon className="w-3 h-3" />
          </button>
          <button
            type="button"
            title="Delete"
            onClick={(e) => { e.stopPropagation(); onDelete(field.id); }}
            className="p-1 text-neutral-300 hover:text-red-400 rounded transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Content area */}
      <div className="px-2.5 py-2 min-h-[40px]" style={{ cursor: isEditing ? "text" : "inherit" }}>
        {isEditing ? (
          <textarea
            autoFocus
            defaultValue={field.text}
            rows={3}
            onBlur={(e) => {
              onChangeRef.current({ ...fieldRef.current, text: e.target.value });
              setIsEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                setIsEditing(false);
              }
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                const el = e.target as HTMLTextAreaElement;
                onChangeRef.current({ ...fieldRef.current, text: el.value });
                setIsEditing(false);
              }
            }}
            className="w-full resize-none border-0 outline-none bg-transparent text-[14px] text-neutral-800 leading-relaxed"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif", minHeight: "40px", userSelect: "text" }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          />
        ) : (
          <p
            className={[
              "text-[14px] leading-relaxed whitespace-pre-wrap",
              field.text ? "text-neutral-800" : "text-neutral-300 italic select-none",
            ].join(" ")}
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            {field.text || "Double-click to type…"}
          </p>
        )}
      </div>

      {/* Resize handle */}
      {isSelected && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: 14,
            height: 14,
            cursor: "nwse-resize",
            zIndex: 7,
          }}
          className="bg-blue-500 rounded-tl opacity-60 hover:opacity-100 transition-opacity"
          onMouseDown={handleResizeMouseDown}
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </div>
  );
}

// ─── Insert block menu ────────────────────────────────────────────────────────

const INSERT_BLOCK_TYPES: Array<{ type: string; label: string }> = [
  { type: "heading",       label: "Heading"        },
  { type: "paragraph",     label: "Paragraph"      },
  { type: "bullet-list",   label: "Bullet List"    },
  { type: "numbered-list", label: "Numbered List"  },
  { type: "checklist",     label: "Checklist"      },
  { type: "note",          label: "Note / Callout" },
  { type: "table",         label: "Table"          },
  { type: "key-value",     label: "Key-Value"      },
  { type: "divider",       label: "Divider"        },
];

function InsertBlockMenu({
  sectionId,
  isOpen,
  onToggle,
  onInsert,
  onInsertFreeform,
}: {
  sectionId: string;
  isOpen: boolean;
  onToggle: () => void;
  onInsert: (sectionId: string, type: string) => void;
  onInsertFreeform?: () => void;
}) {
  return (
    <div
      className="flex justify-center my-1"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="relative">
        <button
          type="button"
          onClick={onToggle}
          className={[
            "flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium transition-all select-none",
            isOpen
              ? "bg-blue-100 text-blue-700 border border-blue-300 shadow-sm"
              : "text-neutral-400 border border-dashed border-neutral-300 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/50",
          ].join(" ")}
        >
          <Plus className="w-3 h-3" />
          Add block here
          <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div
            className="absolute z-30 left-1/2 -translate-x-1/2 mt-1.5 w-44 bg-white rounded-xl border border-neutral-200 shadow-xl overflow-hidden"
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.13)" }}
          >
            <div className="px-2.5 py-2 border-b border-neutral-100">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Add to section</p>
            </div>
            <div className="py-1 max-h-52 overflow-y-auto">
              {INSERT_BLOCK_TYPES.map(({ type, label }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => onInsert(sectionId, type)}
                  className="w-full text-left px-3 py-1.5 text-[12px] text-neutral-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                  {label}
                </button>
              ))}
              {onInsertFreeform && (
                <>
                  <div className="my-1 mx-2 border-t border-neutral-100" />
                  <button
                    type="button"
                    onClick={() => { onInsertFreeform(); }}
                    className="w-full text-left px-3 py-1.5 text-[12px] text-neutral-700 hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-3 h-3 text-neutral-400" />
                    Text Box (overlay)
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Branded header ────────────────────────────────────────────────────────────

function BrandingHeader() {
  const b = useBranding();
  const hasLogo = !!b.logoDataUrl;
  const hasCompany = !!b.companyName.trim();
  const hasDept = !!b.departmentName.trim();
  if (!hasLogo && !hasCompany && !hasDept) return null;

  const color = b.brandColor || "#1d4ed8";

  if (b.headerStyle === "formal") {
    const logoEl = hasLogo && (
      <img
        src={b.logoDataUrl!}
        alt="logo"
        className="h-10 max-w-[120px] object-contain"
        style={{ filter: "brightness(0) invert(1)", opacity: 0.9 }}
      />
    );
    return (
      <div className="mb-7 -mx-0 px-6 py-4 rounded-sm" style={{ backgroundColor: color }}>
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
              <p className="font-bold text-white text-base leading-tight" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
                {b.companyName}
              </p>
            )}
            {hasDept && (
              <p className="text-[12px] text-white/80 mt-0.5" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
                {b.departmentName}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (b.headerStyle === "modern") {
    return (
      <div className="mb-7 flex items-start gap-4" style={{ borderLeft: `4px solid ${color}`, paddingLeft: "16px" }}>
        {hasLogo && b.logoPosition === "left" && (
          <img src={b.logoDataUrl!} alt="logo" className="h-9 max-w-[96px] object-contain shrink-0" />
        )}
        <div className="flex-1">
          {hasCompany && (
            <p className="font-bold text-neutral-900 text-sm leading-tight" style={{ fontFamily: "system-ui, -apple-system, sans-serif", color }}>
              {b.companyName}
            </p>
          )}
          {hasDept && (
            <p className="text-[12px] text-neutral-500 mt-0.5" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
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

  if (b.headerStyle === "internal") {
    return (
      <div className="mb-7 px-4 py-3 rounded-sm bg-neutral-100 flex items-center gap-4">
        {hasLogo && b.logoPosition === "left" && (
          <img src={b.logoDataUrl!} alt="logo" className="h-8 max-w-[80px] object-contain shrink-0" />
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {hasCompany && (
              <p className="text-sm font-semibold text-neutral-700" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
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

  return (
    <div className="mb-7 pb-3" style={{ borderBottom: `2px solid ${color}` }}>
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
            <p className="text-[13px] font-semibold text-neutral-700" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
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

// ─── Branded footer ────────────────────────────────────────────────────────────

function BrandingFooter() {
  const b = useBranding();
  const hasFooter = b.footerText.trim() || b.showPageNumber || b.showConfidential || b.showRevisionLine;
  if (!hasFooter) return null;

  const color = b.brandColor || "#1d4ed8";
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="mt-10 pt-3" style={{ borderTop: `1px solid ${color}40` }}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          {b.footerText.trim() && (
            <p className="text-[11px] text-neutral-500 truncate" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
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

// ─── Watermark ─────────────────────────────────────────────────────────────────

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

// ─── Main export ───────────────────────────────────────────────────────────────

export const BuilderPagePreview = React.memo(function BuilderPagePreview({
  content,
  title,
  selectedBlockId,
  onBlockSelect,
  branding,
  onBlockInlineEdit,
  onBlockDuplicate,
  onBlockDelete,
  onBlockAiGuide,
  onAddBlockToSection,
  freeformFields = [],
  selectedFreeformId,
  onFreeformSelect,
  onFreeformChange,
  onFreeformAdd,
  onFreeformDelete,
  onFreeformDuplicate,
}: Props) {
  const resolvedBranding = branding ?? DEFAULT_BRANDING;
  const sections = [...content.sections].sort((a, b) => a.order - b.order);

  const [inlineEdit, setInlineEdit] = useState<InlineEditState | null>(null);
  const [insertMenuOpenFor, setInsertMenuOpenFor] = useState<string | null>(null);

  function handleInlineEditStart(state: InlineEditState) {
    setInlineEdit(state);
  }

  function handleInlineEditCommit(newText: string) {
    if (!inlineEdit || !onBlockInlineEdit) { setInlineEdit(null); return; }
    const { sectionId, blockId, blockType } = inlineEdit;
    const block = content.sections
      .find((s) => s.id === sectionId)
      ?.blocks.find((b) => b.id === blockId);
    if (!block) { setInlineEdit(null); return; }

    let newPayload: Record<string, unknown>;
    if (blockType === "heading") {
      newPayload = { ...block.payload, text: newText };
    } else if (blockType === "paragraph") {
      newPayload = { text: newText, marks: [] };
    } else if (blockType === "note") {
      newPayload = { ...block.payload, text: newText };
    } else {
      newPayload = { ...block.payload };
    }

    onBlockInlineEdit(sectionId, blockId, newPayload);
    setInlineEdit(null);
  }

  function handleInlineEditCancel() {
    setInlineEdit(null);
  }

  const handlePageClick = () => {
    if (selectedFreeformId && onFreeformSelect) onFreeformSelect(null);
    if (insertMenuOpenFor) setInsertMenuOpenFor(null);
  };

  function handleInsertBlock(sectionId: string, type: string) {
    setInsertMenuOpenFor(null);
    onAddBlockToSection?.(sectionId, type);
  }

  function handleInsertFreeform() {
    setInsertMenuOpenFor(null);
    onFreeformAdd?.();
  }

  return (
    <BrandingCtx.Provider value={resolvedBranding}>
      <div
        className="relative text-[14px] leading-relaxed text-neutral-900"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif", minHeight: "600px" }}
        onClick={handlePageClick}
      >
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

        {sections.length === 0 && !title && freeformFields.length === 0 && (
          <p className="text-neutral-400 text-sm italic text-center pt-24">
            Your document will appear here as you build it.
          </p>
        )}

        {sections.map((section) => (
          <React.Fragment key={section.id}>
            <PreviewSection
              section={section}
              selectedBlockId={selectedBlockId ?? null}
              onBlockSelect={onBlockSelect ?? null}
              inlineEdit={inlineEdit}
              onInlineEditStart={onBlockInlineEdit ? handleInlineEditStart : null}
              onInlineEditCommit={handleInlineEditCommit}
              onInlineEditCancel={handleInlineEditCancel}
              brandColor={resolvedBranding.brandColor || "#1d4ed8"}
              onBlockDuplicate={onBlockDuplicate ?? null}
              onBlockDelete={onBlockDelete ?? null}
              onBlockAiGuide={onBlockAiGuide ?? null}
            />
            {onAddBlockToSection && (
              <InsertBlockMenu
                sectionId={section.id}
                isOpen={insertMenuOpenFor === section.id}
                onToggle={() => setInsertMenuOpenFor(
                  insertMenuOpenFor === section.id ? null : section.id
                )}
                onInsert={handleInsertBlock}
                onInsertFreeform={onFreeformAdd ? handleInsertFreeform : undefined}
              />
            )}
          </React.Fragment>
        ))}

        {/* Freeform fields layer */}
        {freeformFields.map((field) => (
          <FreeformFieldCard
            key={field.id}
            field={field}
            isSelected={selectedFreeformId === field.id}
            onSelect={(id) => onFreeformSelect?.(id)}
            onChange={(updated) => onFreeformChange?.(updated)}
            onDelete={(id) => onFreeformDelete?.(id)}
            onDuplicate={(id) => onFreeformDuplicate?.(id)}
          />
        ))}

        {/* Add Text Box button */}
        {onFreeformAdd && (
          <div className="flex justify-center mt-10 mb-2">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onFreeformAdd(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-neutral-300 text-neutral-400 hover:border-blue-400 hover:text-blue-500 text-[11px] transition-colors select-none"
            >
              <Plus className="w-3 h-3" />
              Add Text Box
            </button>
          </div>
        )}

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
  inlineEdit,
  onInlineEditStart,
  onInlineEditCommit,
  onInlineEditCancel,
  brandColor,
  onBlockDuplicate,
  onBlockDelete,
  onBlockAiGuide,
}: {
  section: BuilderSection;
  selectedBlockId: string | null;
  onBlockSelect: ((sectionId: string, blockId: string) => void) | null;
  inlineEdit: InlineEditState | null;
  onInlineEditStart: ((state: InlineEditState) => void) | null;
  onInlineEditCommit: (newText: string) => void;
  onInlineEditCancel: () => void;
  brandColor: string;
  onBlockDuplicate: ((sectionId: string, blockId: string) => void) | null;
  onBlockDelete: ((sectionId: string, blockId: string) => void) | null;
  onBlockAiGuide: ((sectionId: string, blockId: string) => void) | null;
}) {
  const color = brandColor || "#1d4ed8";
  const blocks = [...section.blocks].sort((a, b) => a.order - b.order);
  const hasContent = blocks.some((b) => hasVisibleContent(b));
  const hasToolbar = !!(onBlockDuplicate || onBlockDelete || onBlockAiGuide);

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
            const isInlineEditable =
              onInlineEditStart &&
              (block.type === "heading" || block.type === "paragraph" || block.type === "note");
            const isCurrentlyEditing = inlineEdit?.blockId === block.id;

            return (
              <div
                key={block.id}
                style={{ position: "relative" }}
                onClick={
                  isClickable && !isCurrentlyEditing
                    ? (e) => { e.stopPropagation(); onBlockSelect!(section.id, block.id); }
                    : undefined
                }
                onDoubleClick={
                  isInlineEditable && !isCurrentlyEditing
                    ? (e) => {
                        e.stopPropagation();
                        const text = getBlockText(block);
                        onInlineEditStart!({
                          sectionId: section.id,
                          blockId: block.id,
                          text,
                          blockType: block.type,
                        });
                      }
                    : undefined
                }
                className={[
                  "rounded transition-all",
                  isClickable && !isCurrentlyEditing ? "cursor-pointer" : "",
                  isCurrentlyEditing
                    ? ""
                    : isSelected
                    ? "ring-2 ring-blue-500 ring-offset-2 bg-blue-50/40"
                    : isClickable
                    ? "hover:ring-1 hover:ring-blue-300 hover:ring-offset-1"
                    : "",
                  isInlineEditable && !isCurrentlyEditing && isSelected
                    ? "cursor-text"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                title={
                  isCurrentlyEditing
                    ? undefined
                    : isInlineEditable && isSelected
                    ? "Double-click to edit inline"
                    : isClickable
                    ? "Click to select · Double-click to edit"
                    : undefined
                }
              >
                {/* Floating mini-toolbar (visible when selected, not editing) */}
                {isSelected && !isCurrentlyEditing && hasToolbar && (
                  <div
                    style={{ position: "absolute", top: -34, right: 0, zIndex: 20, whiteSpace: "nowrap" }}
                    className="flex items-center gap-0.5 bg-neutral-800 rounded-lg px-1.5 py-1 shadow-lg"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {onBlockAiGuide && (
                      <button
                        type="button"
                        title="AI Guide"
                        onClick={(e) => { e.stopPropagation(); onBlockAiGuide(section.id, block.id); }}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors"
                      >
                        <Sparkles className="w-3 h-3" />
                        AI
                      </button>
                    )}
                    {onBlockAiGuide && (onBlockDuplicate || onBlockDelete) && (
                      <div className="w-px h-3 bg-neutral-600 mx-0.5" />
                    )}
                    {onBlockDuplicate && (
                      <button
                        type="button"
                        title="Duplicate block"
                        onClick={(e) => { e.stopPropagation(); onBlockDuplicate(section.id, block.id); }}
                        className="p-1 rounded text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors"
                      >
                        <CopyIcon className="w-3 h-3" />
                      </button>
                    )}
                    {onBlockDelete && (
                      <button
                        type="button"
                        title="Delete block"
                        onClick={(e) => { e.stopPropagation(); onBlockDelete(section.id, block.id); }}
                        className="p-1 rounded text-neutral-300 hover:text-red-400 hover:bg-neutral-700 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}

                {isCurrentlyEditing ? (
                  <InlineTextarea
                    text={inlineEdit!.text}
                    blockType={inlineEdit!.blockType}
                    brandColor={color}
                    onCommit={onInlineEditCommit}
                    onCancel={onInlineEditCancel}
                  />
                ) : (
                  <PreviewBlock block={block} />
                )}
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

// ─── getBlockText ──────────────────────────────────────────────────────────────

function getBlockText(block: BuilderBlock): string {
  const p = block.payload as Record<string, unknown>;
  if (typeof p.text === "string") return p.text;
  return "";
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
      info:    { box: "bg-blue-50 border-blue-300 text-blue-900",    label: "Note" },
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
    return <hr className="my-2" style={{ borderColor: `${color}30` }} />;
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
