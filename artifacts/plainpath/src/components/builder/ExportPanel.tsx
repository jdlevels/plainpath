import { Download, FileText, FileType } from "lucide-react";

interface Props {
  onDownloadTxt: () => void;
  documentTitle: string;
}

export function ExportPanel({ onDownloadTxt, documentTitle }: Props) {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 pt-4 pb-3 border-b border-border/60">
        <p className="text-xs font-semibold text-foreground">Export</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Download your document in available formats.
        </p>
      </div>

      <div className="px-4 py-4 space-y-3">
        <button
          type="button"
          onClick={onDownloadTxt}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-border bg-card hover:border-foreground/30 hover:bg-secondary transition-colors text-left"
        >
          <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Plain text (.txt)</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {documentTitle ? `${documentTitle}.txt` : "document.txt"}
            </p>
          </div>
          <Download className="w-4 h-4 text-muted-foreground shrink-0" />
        </button>

        <div className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-border/50 bg-card/50 opacity-60 cursor-not-allowed">
          <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
            <FileType className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground">PDF document</p>
              <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                Coming soon
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Formatted PDF with branding</p>
          </div>
        </div>

        <div className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-border/50 bg-card/50 opacity-60 cursor-not-allowed">
          <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground">Word document (.docx)</p>
              <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                Coming soon
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Editable Word format</p>
          </div>
        </div>

        <div className="rounded-xl bg-muted/30 border border-border px-3 py-2.5 mt-2">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Brand styling — including your logo, company name, brand color, and footer — will apply to PDF/DOCX export when those export formats are enabled.
          </p>
        </div>

        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2.5 mt-2">
          <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed font-medium">
            Freeform layout export to PDF/DOCX coming soon.
          </p>
          <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed mt-0.5">
            Text boxes placed on the canvas are saved with your document and will be included in PDF/DOCX export in a future update. Plain text (.txt) export includes structured content only.
          </p>
        </div>
      </div>
    </div>
  );
}
