import { useState } from "react";
import { ChevronRight, ChevronDown, Plus, Trash2, MoveUp, MoveDown } from "lucide-react";
import type { BuilderSection, KnownBlockType } from "@/lib/builderTypes";
import { BLOCK_TYPE_LABELS } from "@/lib/builderTypes";
import { AddBlockButton } from "./BlockTypePicker";

interface Props {
  sections: BuilderSection[];
  activeSectionId: string | null;
  selectedBlockId: string | null;
  onSectionClick: (sectionId: string) => void;
  onAddSection: () => void;
  onMoveSection: (sectionId: string, direction: "up" | "down") => void;
  onDeleteSection: (sectionId: string) => void;
  onUpdateSectionTitle: (sectionId: string, title: string) => void;
  onAddBlock: (sectionId: string, type: KnownBlockType) => void;
  onSelectBlock: (sectionId: string, blockId: string) => void;
  onDeleteBlock: (sectionId: string, blockId: string) => void;
}

export function OutlinePanel({
  sections,
  activeSectionId,
  selectedBlockId,
  onSectionClick,
  onAddSection,
  onMoveSection,
  onDeleteSection,
  onUpdateSectionTitle,
  onAddBlock,
  onSelectBlock,
  onDeleteBlock,
}: Props) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const sorted = [...sections].sort((a, b) => a.order - b.order);

  function toggleExpand(sectionId: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  }

  function handleDelete(sectionId: string) {
    if (deleteConfirm === sectionId) {
      onDeleteSection(sectionId);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(sectionId);
      setTimeout(() => setDeleteConfirm((v) => (v === sectionId ? null : v)), 3000);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 border-b border-border/60">
        <p className="text-xs font-semibold text-foreground">
          Document Outline
          <span className="ml-1.5 text-muted-foreground font-normal">({sorted.length} section{sorted.length !== 1 ? "s" : ""})</span>
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Add, reorder, or delete sections. Click a block to edit it.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 && (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">No sections yet.</p>
          </div>
        )}

        {sorted.map((section, idx) => {
          const isActive = activeSectionId === section.id;
          const isExpanded = expandedSections.has(section.id);
          const sortedBlocks = [...section.blocks].sort((a, b) => a.order - b.order);

          return (
            <div key={section.id} className="border-b border-border/40 last:border-b-0">
              <div
                className={`group flex items-center gap-1 px-3 py-2 transition-colors ${
                  isActive ? "bg-primary/6" : "hover:bg-secondary/50"
                }`}
              >
                <button
                  onClick={() => toggleExpand(section.id)}
                  className="shrink-0 p-0.5 text-muted-foreground hover:text-foreground transition-colors rounded"
                  title={isExpanded ? "Collapse" : "Expand"}
                >
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </button>

                <button
                  onClick={() => onSectionClick(section.id)}
                  className="flex-1 min-w-0 text-left"
                >
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => onUpdateSectionTitle(section.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Untitled section"
                    className={`w-full bg-transparent border-none outline-none text-[13px] font-medium truncate placeholder:text-muted-foreground/40 ${
                      isActive ? "text-primary" : "text-foreground"
                    }`}
                  />
                </button>

                <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onMoveSection(section.id, "up")}
                    disabled={idx === 0}
                    title="Move up"
                    className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                  >
                    <MoveUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onMoveSection(section.id, "down")}
                    disabled={idx === sorted.length - 1}
                    title="Move down"
                    className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                  >
                    <MoveDown className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDelete(section.id)}
                    title={deleteConfirm === section.id ? "Click again to confirm" : "Delete section"}
                    className={`p-1 rounded transition-colors ${
                      deleteConfirm === section.id
                        ? "text-destructive bg-destructive/10"
                        : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    }`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="pl-7 pr-3 pb-2 space-y-0.5">
                  {sortedBlocks.length === 0 && (
                    <p className="text-[11px] text-muted-foreground/60 py-1 italic">No blocks yet</p>
                  )}
                  {sortedBlocks.map((block) => (
                    <button
                      key={block.id}
                      onClick={() => onSelectBlock(section.id, block.id)}
                      className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-left text-[12px] transition-colors ${
                        selectedBlockId === block.id
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`}
                    >
                      <span className="truncate">
                        {BLOCK_TYPE_LABELS[block.type as keyof typeof BLOCK_TYPE_LABELS] ?? block.type}
                        {block.payload?.text
                          ? ` — ${String(block.payload.text).slice(0, 28)}${String(block.payload.text).length > 28 ? "…" : ""}`
                          : ""}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteBlock(section.id, block.id); }}
                        className="shrink-0 p-0.5 rounded text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Delete block"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </button>
                  ))}

                  <div className="pt-1">
                    <AddBlockButton onSelect={(type) => onAddBlock(section.id, type)} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="px-3 py-3 border-t border-border/60">
        <button
          onClick={onAddSection}
          className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-border hover:border-primary/40 rounded-xl text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Add section
        </button>
      </div>
    </div>
  );
}
