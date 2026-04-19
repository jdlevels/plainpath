import { Plus, X } from "lucide-react";
import type { TablePayload } from "@/lib/builderTypes";

interface Props {
  payload: TablePayload;
  onChange: (p: TablePayload) => void;
}

export function TableBlock({ payload, onChange }: Props) {
  const columns = payload.columns ?? ["Column 1"];
  const rows = payload.rows ?? [Array(columns.length).fill("")];
  const hasHeaderRow = payload.has_header_row ?? true;

  function updateColumn(colIdx: number, value: string) {
    const next = [...columns];
    next[colIdx] = value;
    onChange({ ...payload, columns: next });
  }

  function addColumn() {
    if (columns.length >= 10) return;
    onChange({
      ...payload,
      columns: [...columns, `Column ${columns.length + 1}`],
      rows: rows.map((row) => [...row, ""]),
    });
  }

  function removeColumn(colIdx: number) {
    if (columns.length === 1) return;
    onChange({
      ...payload,
      columns: columns.filter((_, i) => i !== colIdx),
      rows: rows.map((row) => row.filter((_, i) => i !== colIdx)),
    });
  }

  function updateCell(rowIdx: number, colIdx: number, value: string) {
    const next = rows.map((row, r) =>
      r === rowIdx ? row.map((cell, c) => (c === colIdx ? value : cell)) : row,
    );
    onChange({ ...payload, rows: next });
  }

  function addRow() {
    if (rows.length >= 50) return;
    onChange({ ...payload, rows: [...rows, Array(columns.length).fill("")] });
  }

  function removeRow(rowIdx: number) {
    if (rows.length === 1) return;
    onChange({ ...payload, rows: rows.filter((_, i) => i !== rowIdx) });
  }

  return (
    <div className="space-y-2 overflow-x-auto">
      <div className="flex items-center gap-2 mb-1">
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hasHeaderRow}
            onChange={(e) => onChange({ ...payload, has_header_row: e.target.checked })}
            className="rounded border-border accent-primary"
          />
          Header row
        </label>
      </div>

      <table className="min-w-full text-sm border-collapse">
        <thead>
          <tr>
            {columns.map((col, c) => (
              <th
                key={c}
                className="border border-border bg-muted/40 p-0"
              >
                <div className="flex items-center">
                  <input
                    type="text"
                    value={col}
                    onChange={(e) => updateColumn(c, e.target.value)}
                    className="flex-1 bg-transparent px-2 py-1.5 font-semibold text-foreground outline-none text-xs min-w-0"
                    placeholder={`Col ${c + 1}`}
                  />
                  {columns.length > 1 && (
                    <button
                      onClick={() => removeColumn(c)}
                      className="px-1 text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </th>
            ))}
            {columns.length < 10 && (
              <th className="border border-border bg-muted/20 p-0">
                <button
                  onClick={addColumn}
                  className="w-full px-2 py-1.5 text-muted-foreground hover:text-foreground"
                >
                  <Plus className="w-3.5 h-3.5 mx-auto" />
                </button>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r} className="group">
              {row.map((cell, c) => (
                <td key={c} className="border border-border p-0">
                  <input
                    type="text"
                    value={cell}
                    onChange={(e) => updateCell(r, c, e.target.value)}
                    maxLength={2000}
                    className="w-full px-2 py-1.5 bg-transparent outline-none text-foreground text-xs min-w-0"
                    placeholder=""
                  />
                </td>
              ))}
              <td className="border-0 pl-1">
                {rows.length > 1 && (
                  <button
                    onClick={() => removeRow(r)}
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

      {rows.length < 50 && (
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
