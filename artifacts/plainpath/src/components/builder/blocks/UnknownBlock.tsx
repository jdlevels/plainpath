import { AlertTriangle, Trash2 } from "lucide-react";

interface Props {
  type: string;
  onRemove: () => void;
}

export function UnknownBlock({ type, onRemove }: Props) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/20 p-3">
      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">Unsupported block</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Block type <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">{type}</code> is not supported in
          this version. Its content has been preserved and will not be lost.
        </p>
      </div>
      <button
        onClick={onRemove}
        className="shrink-0 flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 border border-destructive/30 hover:border-destructive/60 rounded px-2 py-1 transition-colors"
      >
        <Trash2 className="w-3 h-3" />
        Remove
      </button>
    </div>
  );
}
