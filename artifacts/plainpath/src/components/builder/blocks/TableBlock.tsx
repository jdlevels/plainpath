import { Plus, X } from "lucide-react";
import type { TablePayload } from "@/lib/builderTypes";

interface Props {
  payload: TablePayload;
  onChange: (p: TablePayload) => void;
}

const MAX_COLS = 10;
const MAX_ROWS = 50;
const MIN_CELL_WIDTH = 120;

export function TableBlock({ payload, onChange }: Props) {
  const columns = payload.columns ?? ["Column 1"];
  const rows = payload.rows ?? [Array(columns.length).fill("")];
  const hasHeaderRow = payload.has_header_row ?? true;

  function ensureRowWidth(existingRows: string[][], colCount: number): string[][] {
    return existingRows.map((row) => {
      if (row.length === colCount) return row;
      if (row.length < colCount) return [...row, ...Array(colCount - row.length).fill("")];
      return row.slice(0, colCount);
    });
  }

  function updateColumn(colIdx: number, value: string) {
    const next = [...columns];
    next[colIdx] = value;
    onChange({ ...payload, columns: next });
  }

  function addColumn() {
    if (columns.length >= MAX_COLS) return;
    const newColumns = [...columns, `Column ${columns.length + 1}`];
    const newRows = rows.map((row) => [...row, ""]);
    onChange({ ...payload, columns: newColumns, rows: newRows });
  }

  function removeColumn(colIdx: number) {
    if (columns.length === 1) return;
    const newColumns = columns.filter((_, i) => i !== colIdx);
    const newRows = rows.map((row) => row.filter((_, i) => i !== colIdx));
    onChange({ ...payload, columns: newColumns, rows: newRows });
  }

  function updateCell(rowIdx: number, colIdx: number, value: string) {
    const next = rows.map((row, r) =>
      r === rowIdx ? row.map((cell, c) => (c === colIdx ? value : cell)) : row,
    );
    onChange({ ...payload, rows: next });
  }

  function addRow() {
    if (rows.length >= MAX_ROWS) return;
    const safeRows = ensureRowWidth(rows, columns.length);
    onChange({ ...payload, rows: [...safeRows, Array(columns.length).fill("")] });
  }

  function removeRow(rowIdx: number) {
    if (rows.length === 1) return;
    onChange({ ...payload, rows: rows.filter((_, i) => i !== rowIdx) });
  }

  const safeRows = ensureRowWidth(rows, columns.length);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hasHeaderRow}
            onChange={(e) => onChange({ ...payload, has_header_row: e.target.checked })}
            className="rounded border-border accent-primary"
          />
          Header row
        </label>
        <span className="text-xs text-muted-foreground/50">
          {columns.length} col{columns.length !== 1 ? "s" : ""} · {safeRows.length} row{safeRows.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="text-sm border-collapse w-full" style={{ minWidth: `${columns.length * MIN_CELL_WIDTH}px`, tableLayout: "fixed" }}>
          <thead>
            <tr>
              {columns.map((col, c) => (
                <th
                  key={c}
                  className="border-b border-r last:border-r-0 border-border bg-muted/50 p-0"
                  style={{ minWidth: `${MIN_CELL_WIDTH}px` }}
                >
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={col}
                      onChange={(e) => updateColumn(c, e.target.value)}
                      className="flex-1 bg-transparent px-2.5 py-2 font-semibold text-foreground outline-none text-xs min-w-0"
                      placeholder={`Column ${c + 1}`}
                      maxLength={100}
                    />
                    {columns.length > 1 && (
                      <button
                        onClick={() => removeColumn(c)}
                        title="Remove column"
                        className="px-1.5 py-1 text-muted-foreground hover:text-destructive shrink-0 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </th>
              ))}
              {columns.length < MAX_COLS && (
                <th className="border-b border-border bg-muted/20 p-0 w-8">
                  <button
                    onClick={addColumn}
                    title="Add column"
                    className="w-full h-full px-2 py-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 mx-auto" />
                  </button>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {safeRows.map((row, r) => (
              <tr key={r} className="group hover:bg-muted/20 transition-colors">
                {row.map((cell, c) => (
                  <td
                    key={c}
                    className="border-b last-row:border-b-0 border-r last:border-r-0 border-border/60 p-0"
                  >
                    <input
                      type="text"
                      value={cell}
                      onChange={(e) => updateCell(r, c, e.target.value)}
                      maxLength={2000}
                      className="w-full px-2.5 py-1.5 bg-transparent outline-none text-foreground text-xs"
                      placeholder=""
                    />
                  </td>
                ))}
                {columns.length < MAX_COLS && <td className="border-b border-border/60 w-8" />}
                <td className="border-0 w-6 pl-1">
                  {safeRows.length > 1 && (
                    <button
                      onClick={() => removeRow(r)}
                      title="Remove row"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {safeRows.length < MAX_ROWS && (
        <button
          onClick={addRow}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add row
        </button>
      )}
    </div>
  );
}
