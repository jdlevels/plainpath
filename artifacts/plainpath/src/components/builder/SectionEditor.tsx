import { ChevronUp, ChevronDown, Trash2, GripVertical } from "lucide-react";
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
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
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
          <button
            onClick={onDelete}
            title="Delete section"
            className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Blocks */}
      <div className="p-4 space-y-3">
        {blocks.length === 0 && (
          <p className="text-sm text-muted-foreground/50 text-center py-4">
            No blocks yet. Add one below.
          </p>
        )}
        {blocks.map((block, i) => (
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
        ))}
        <AddBlockButton onSelect={addBlock} />
      </div>
    </div>
  );
}
