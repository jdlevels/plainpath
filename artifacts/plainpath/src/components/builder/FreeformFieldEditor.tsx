import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Trash2, Copy as CopyIcon, SquarePen } from "lucide-react";
import type { FreeformField } from "@/lib/builderTypes";

const GRID = 8;
const NUDGE = GRID;
const MAX_X = 560;
const MAX_Y = 2000;
const MIN_W = 80;
const MAX_W = 580;
const MIN_H = 40;
const MAX_H = 800;

function snap(v: number) { return Math.round(v / GRID) * GRID; }

interface Props {
  field: FreeformField;
  onChange: (updated: FreeformField) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onDeselect: () => void;
}

export function FreeformFieldEditor({ field, onChange, onDelete, onDuplicate, onDeselect }: Props) {
  function nudge(dx: number, dy: number) {
    onChange({
      ...field,
      x: Math.max(0, Math.min(MAX_X, field.x + dx)),
      y: Math.max(0, Math.min(MAX_Y, field.y + dy)),
    });
  }

  function setX(val: number) {
    onChange({ ...field, x: snap(Math.max(0, Math.min(MAX_X, isNaN(val) ? field.x : val))) });
  }
  function setY(val: number) {
    onChange({ ...field, y: snap(Math.max(0, Math.min(MAX_Y, isNaN(val) ? field.y : val))) });
  }
  function setW(val: number) {
    onChange({ ...field, width: snap(Math.max(MIN_W, Math.min(MAX_W, isNaN(val) ? field.width : val))) });
  }
  function setH(val: number) {
    onChange({ ...field, height: snap(Math.max(MIN_H, Math.min(MAX_H, isNaN(val) ? field.height : val))) });
  }

  const nudgeBtn =
    "p-1.5 rounded border border-border/60 bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground transition-colors";

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 pt-4 pb-3 border-b border-border/60 shrink-0">
        <div className="flex items-center gap-2">
          <SquarePen className="w-3.5 h-3.5 text-muted-foreground/60" />
          <p className="text-xs font-semibold text-foreground">Text Box</p>
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Freeform overlay field. Drag on the page or use nudge controls below.
        </p>
      </div>

      <div className="px-4 py-4 space-y-5">

        {/* Text content */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 block mb-1.5">
            Content
          </label>
          <textarea
            value={field.text}
            rows={4}
            onChange={(e) => onChange({ ...field, text: e.target.value })}
            placeholder="Enter text…"
            className="w-full text-sm bg-secondary border border-border/60 rounded-lg px-3 py-2 resize-y outline-none focus:ring-1 focus:ring-ring text-foreground placeholder:text-muted-foreground/50 leading-relaxed"
          />
        </div>

        {/* Position */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 block mb-2">
            Position
          </label>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <label className="text-[10px] text-muted-foreground block mb-1">X (px from left)</label>
              <input
                type="number"
                value={Math.round(field.x)}
                min={0}
                max={MAX_X}
                onChange={(e) => setX(parseInt(e.target.value, 10))}
                className="w-full text-xs bg-secondary border border-border/60 rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-ring text-foreground"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground block mb-1">Y (px from top)</label>
              <input
                type="number"
                value={Math.round(field.y)}
                min={0}
                onChange={(e) => setY(parseInt(e.target.value, 10))}
                className="w-full text-xs bg-secondary border border-border/60 rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-ring text-foreground"
              />
            </div>
          </div>

          {/* Directional nudge pad */}
          <div className="flex items-center justify-center">
            <div className="grid grid-cols-3 gap-1 w-fit">
              <div />
              <button type="button" onClick={() => nudge(0, -NUDGE)} className={nudgeBtn} title={`Move up ${NUDGE}px`}>
                <ChevronUp className="w-3 h-3 mx-auto" />
              </button>
              <div />
              <button type="button" onClick={() => nudge(-NUDGE, 0)} className={nudgeBtn} title={`Move left ${NUDGE}px`}>
                <ChevronLeft className="w-3 h-3 mx-auto" />
              </button>
              <div className="p-1.5 rounded bg-muted/40 border border-border/40 flex items-center justify-center select-none">
                <div className="w-2 h-2 rounded-sm bg-muted-foreground/20" />
              </div>
              <button type="button" onClick={() => nudge(NUDGE, 0)} className={nudgeBtn} title={`Move right ${NUDGE}px`}>
                <ChevronRight className="w-3 h-3 mx-auto" />
              </button>
              <div />
              <button type="button" onClick={() => nudge(0, NUDGE)} className={nudgeBtn} title={`Move down ${NUDGE}px`}>
                <ChevronDown className="w-3 h-3 mx-auto" />
              </button>
              <div />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground/50 text-center mt-1.5 select-none">
            Nudges {NUDGE}px per click
          </p>
        </div>

        {/* Size */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 block mb-2">
            Size
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground block mb-1">Width (px)</label>
              <input
                type="number"
                value={Math.round(field.width)}
                min={MIN_W}
                max={MAX_W}
                onChange={(e) => setW(parseInt(e.target.value, 10))}
                className="w-full text-xs bg-secondary border border-border/60 rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-ring text-foreground"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground block mb-1">Height (px)</label>
              <input
                type="number"
                value={Math.round(field.height)}
                min={MIN_H}
                max={MAX_H}
                onChange={(e) => setH(parseInt(e.target.value, 10))}
                className="w-full text-xs bg-secondary border border-border/60 rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-ring text-foreground"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 block mb-2">
            Actions
          </label>
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={onDuplicate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 bg-secondary hover:bg-muted text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <CopyIcon className="w-3 h-3" />
              Duplicate
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 bg-secondary hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 text-xs text-muted-foreground transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onDeselect}
          className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
        >
          Deselect
        </button>
      </div>
    </div>
  );
}
