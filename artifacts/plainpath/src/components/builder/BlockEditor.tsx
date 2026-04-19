import { ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import type {
  BuilderBlock, KnownBlockType,
  HeadingPayload, ParagraphPayload, BulletListPayload, NumberedListPayload,
  ChecklistPayload, KeyValuePayload, DividerPayload, NotePayload, TablePayload,
} from "@/lib/builderTypes";
import { BLOCK_TYPE_LABELS, KNOWN_BLOCK_TYPES } from "@/lib/builderTypes";
import { HeadingBlock } from "./blocks/HeadingBlock";
import { ParagraphBlock } from "./blocks/ParagraphBlock";
import { BulletListBlock } from "./blocks/BulletListBlock";
import { NumberedListBlock } from "./blocks/NumberedListBlock";
import { ChecklistBlock } from "./blocks/ChecklistBlock";
import { KeyValueBlock } from "./blocks/KeyValueBlock";
import { DividerBlock } from "./blocks/DividerBlock";
import { NoteBlock } from "./blocks/NoteBlock";
import { TableBlock } from "./blocks/TableBlock";
import { UnknownBlock } from "./blocks/UnknownBlock";

interface Props {
  block: BuilderBlock;
  isFirst: boolean;
  isLast: boolean;
  onChange: (payload: Record<string, unknown>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}

function BlockContent({
  block,
  onChange,
  onDelete,
}: {
  block: BuilderBlock;
  onChange: (p: Record<string, unknown>) => void;
  onDelete: () => void;
}) {
  if (block._unknown) {
    return <UnknownBlock type={block.type} onRemove={onDelete} />;
  }

  const p = block.payload;

  function wrap<T>(handler: (v: T) => void): (v: T) => void {
    return (v) => onChange(v as unknown as Record<string, unknown>);
  }

  switch (block.type as KnownBlockType) {
    case "heading":
      return (
        <HeadingBlock
          payload={p as unknown as HeadingPayload}
          onChange={wrap<HeadingPayload>(onChange as any)}
        />
      );
    case "paragraph":
      return (
        <ParagraphBlock
          payload={p as unknown as ParagraphPayload}
          onChange={wrap<ParagraphPayload>(onChange as any)}
        />
      );
    case "bullet-list":
      return (
        <BulletListBlock
          payload={p as unknown as BulletListPayload}
          onChange={wrap<BulletListPayload>(onChange as any)}
        />
      );
    case "numbered-list":
      return (
        <NumberedListBlock
          payload={p as unknown as NumberedListPayload}
          onChange={wrap<NumberedListPayload>(onChange as any)}
        />
      );
    case "checklist":
      return (
        <ChecklistBlock
          payload={p as unknown as ChecklistPayload}
          onChange={wrap<ChecklistPayload>(onChange as any)}
        />
      );
    case "key-value":
      return (
        <KeyValueBlock
          payload={p as unknown as KeyValuePayload}
          onChange={wrap<KeyValuePayload>(onChange as any)}
        />
      );
    case "divider":
      return (
        <DividerBlock
          payload={p as unknown as DividerPayload}
          onChange={wrap<DividerPayload>(onChange as any)}
        />
      );
    case "note":
      return (
        <NoteBlock
          payload={p as unknown as NotePayload}
          onChange={wrap<NotePayload>(onChange as any)}
        />
      );
    case "table":
      return (
        <TableBlock
          payload={p as unknown as TablePayload}
          onChange={wrap<TablePayload>(onChange as any)}
        />
      );
    default:
      return <UnknownBlock type={block.type} onRemove={onDelete} />;
  }
}

export function BlockEditor({ block, isFirst, isLast, onChange, onMoveUp, onMoveDown, onDelete }: Props) {
  const isUnknown = block._unknown === true || !KNOWN_BLOCK_TYPES.includes(block.type as KnownBlockType);
  const label = isUnknown
    ? "Unknown block"
    : BLOCK_TYPE_LABELS[block.type as KnownBlockType];

  return (
    <div className="group relative rounded-lg border border-border/50 hover:border-border bg-card transition-colors">
      {/* Block type label + controls */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/40 bg-muted/20 rounded-t-lg">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          {label}
        </span>
        {!isUnknown && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onMoveUp}
              disabled={isFirst}
              title="Move up"
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onMoveDown}
              disabled={isLast}
              title="Move down"
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDelete}
              title="Delete block"
              className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Block content */}
      <div className="p-3">
        <BlockContent block={block} onChange={onChange} onDelete={onDelete} />
      </div>
    </div>
  );
}
