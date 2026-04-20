import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { Plus, Loader2, AlertCircle, FileText, ChevronRight, RefreshCw } from "lucide-react";
import type { BuilderDocumentMeta } from "@/lib/builderTypes";
import { useBuilderApi } from "@/hooks/useBuilderApi";
import { CATEGORY_LABELS } from "@/lib/builderConfig";

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 2) return "Just now";
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function BuilderList() {
  const [, navigate] = useLocation();
  const api = useBuilderApi();
  const [docs, setDocs] = useState<BuilderDocumentMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api.listDocuments().then((d) => {
      setDocs(d);
      setLoading(false);
    }).catch(() => {
      setError("Failed to load your documents.");
      setLoading(false);
    });
  }, [api.listDocuments]);

  useEffect(() => {
    document.title = "Document Builder — PlainPath"
    return () => { document.title = "PlainPath" }
  }, [])

  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Document Builder</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create structured documents from scratch or a template.
          </p>
        </div>
        <Link
          href="/builder/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          New document
        </Link>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="text-center py-16">
          <AlertCircle className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <button
            onClick={load}
            className="flex items-center gap-1.5 text-sm text-primary hover:underline mx-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && docs.length === 0 && (
        <div className="text-center py-20 rounded-2xl border-2 border-dashed border-border">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <FileText className="w-7 h-7 text-muted-foreground/50" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">No documents yet</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
            Create your first document from scratch or start from one of the built-in templates.
          </p>
          <Link
            href="/builder/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create your first document
          </Link>
        </div>
      )}

      {/* Document list */}
      {!loading && !error && docs.length > 0 && (
        <div className="space-y-2">
          {docs.map((doc) => (
            <button
              key={doc.id}
              onClick={() => navigate(`/builder/${doc.id}`)}
              className="w-full text-left flex items-center gap-4 px-4 py-3.5 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/3 bg-card transition-colors group"
            >
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <FileText className="w-4.5 h-4.5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="font-medium text-foreground truncate">{doc.title}</span>
                  {doc.source === "template" && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/60 hidden sm:inline">
                      Template
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {doc.category && (
                    <span className="text-xs text-muted-foreground">
                      {CATEGORY_LABELS[doc.category] ?? doc.category}
                    </span>
                  )}
                  <span className="text-muted-foreground/40 text-xs hidden sm:inline">·</span>
                  <span className="text-xs text-muted-foreground/60">
                    {doc.sectionCount} section{doc.sectionCount !== 1 ? "s" : ""}
                  </span>
                  <span className="text-muted-foreground/40 text-xs">·</span>
                  <span className="text-xs text-muted-foreground/60">
                    {doc.blockCount} block{doc.blockCount !== 1 ? "s" : ""}
                  </span>
                  <span className="text-muted-foreground/40 text-xs hidden sm:inline">·</span>
                  <span className="text-xs text-muted-foreground/60">
                    Edited {formatDate(doc.updatedAt)}
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded-full bg-secondary text-muted-foreground border border-border/60 shrink-0">
                Draft
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
