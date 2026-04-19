import { useState } from "react";
import { ChevronUp, ChevronDown, Trash2, GripVertical, Plus } from "lucide-react";
import type { BuilderSection, BuilderBlock, KnownBlockType } from "@/lib/builderTypes";
import { BlockEditor } from "./BlockEditor";
import { AddBlockButton } from "./BlockTypePicker";
import { getDefaultPayload } from "./blockDefaults";

interface Props {
  section: BuilderSection;
  isFirst: boolean;
  isLast: boolean;
  onChange: (updated: BuilderSection) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}

export function SectionEditor({
  section,
  isFirst,
  isLast,
  onChange,
  onMoveUp,
  onMoveDown,
  onDelete,
}: Props) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const blocks = [...section.blocks].sort((a, b) => a.order - b.order);

  function updateTitle(title: string) {
    onChange({ ...section, title });
  }

  function addBlock(type: KnownBlockType) {
    const maxOrder = blocks.length > 0 ? Math.max(...blocks.map((b) => b.order)) : -1;
    const newBlock: BuilderBlock = {
      id: crypto.randomUUID(),
      type,
      order: maxOrder + 1,
      payload: getDefaultPayload(type),
    };
    onChange({ ...section, blocks: [...section.blocks, newBlock] });
  }

  function updateBlock(blockId: string, payload: Record<string, unknown>) {
    onChange({
      ...section,
      blocks: section.blocks.map((b) =>
        b.id === blockId ? { ...b, payload } : b,
      ),
    });
  }

  function deleteBlock(blockId: string) {
    const remaining = section.blocks
      .filter((b) => b.id !== blockId)
      .map((b, i) => ({ ...b, order: i }));
    onChange({ ...section, blocks: remaining });
  }

  function moveBlock(blockId: string, direction: "up" | "down") {
    const sorted = [...blocks];
    const idx = sorted.findIndex((b) => b.id === blockId);
    if (idx === -1) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;

    const reordered = sorted.map((b, i) => {
      if (i === idx) return { ...sorted[targetIdx], order: i };
      if (i === targetIdx) return { ...sorted[idx], order: i };
      return { ...b, order: i };
    });

    onChange({ ...section, blocks: reordered });
  }

  return (
    <div
      id={`section-${section.id}`}
      className="rounded-xl border border-border bg-card shadow-sm overflow-hidden"
    >
      {/* Section header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-muted/30 border-b border-border group">
        <GripVertical className="w-4 h-4 text-muted-foreground/30 shrink-0" />
        <input
          type="text"
          value={section.title}
          onChange={(e) => updateTitle(e.target.value)}
          maxLength={120}
          placeholder="Section title"
          className="flex-1 bg-transparent border-none outline-none font-semibold text-foreground placeholder:text-muted-foreground/40 text-base"
        />

        {/* Controls — always visible on mobile, hover-reveal on desktop */}
        <div className="flex items-center gap-0.5 ml-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            title="Move section up"
            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={isLast}
            title="Move section down"
            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {/* Delete with inline confirm */}
          {showDeleteConfirm ? (
            <span className="flex items-center gap-1 ml-1">
              <button
                onClick={() => { setShowDeleteConfirm(false); onDelete(); }}
                className="px-2 py-0.5 rounded text-xs font-medium text-destructive border border-destructive/40 hover:bg-destructive hover:text-destructive-foreground transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-2 py-0.5 rounded text-xs font-medium text-muted-foreground hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
            </span>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              title="Delete section"
              className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Blocks area */}
      <div className="p-4 space-y-3">
        {blocks.length === 0 ? (
          /* Empty state — actionable CTA instead of plain text */
          <button
            onClick={() => addBlock("paragraph")}
            className="w-full flex flex-col items-center gap-2 py-6 rounded-lg border border-dashed border-border/60 text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/30 transition-colors group/empty"
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-muted group-hover/empty:bg-secondary transition-colors">
              <Plus className="w-4 h-4" />
            </span>
            <span className="text-sm font-medium">Add first block</span>
            <span className="text-xs opacity-60">
              Click to add a paragraph, or use the button below for other block types
            </span>
          </button>
        ) : (
          blocks.map((block, i) => (
            <BlockEditor
              key={block.id}
              block={block}
              isFirst={i === 0}
              isLast={i === blocks.length - 1}
              onChange={(payload) => updateBlock(block.id, payload)}
              onMoveUp={() => moveBlock(block.id, "up")}
              onMoveDown={() => moveBlock(block.id, "down")}
              onDelete={() => deleteBlock(block.id)}
            />
          ))
        )}
        <AddBlockButton onSelect={addBlock} />
      </div>
    </div>
  );
}
