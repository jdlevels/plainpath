import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Plus, Loader2, AlertCircle, FileText, ChevronRight } from "lucide-react";
import { builderApi } from "@/lib/builderApi";
import type { BuilderDocumentMeta } from "@/lib/builderTypes";
import { CATEGORY_LABELS } from "@/lib/builderConfig";

function StatusBadge({ status }: { status: string }) {
  if (status === "final") {
    return (
      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
        Final
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-secondary text-muted-foreground border border-border">
      Draft
    </span>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function BuilderList() {
  const [, navigate] = useLocation();
  const [docs, setDocs] = useState<BuilderDocumentMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    builderApi.listDocuments().then((d) => {
      setDocs(d);
      setLoading(false);
    }).catch(() => {
      setError("Failed to load your documents.");
      setLoading(false);
    });
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Document Builder</h1>
          <p className="text-sm text-muted-foreground mt-1">Create and manage structured documents.</p>
        </div>
        <Link
          href="/builder/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New document
        </Link>
      </div>

      {/* Content */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && error && (
        <div className="flex items-center gap-2 text-destructive py-8 justify-center text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {!loading && !error && docs.length === 0 && (
        <div className="text-center py-16 rounded-xl border-2 border-dashed border-border">
          <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-medium text-foreground mb-1">No documents yet</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Create your first structured document to get started.
          </p>
          <Link
            href="/builder/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New document
          </Link>
        </div>
      )}

      {!loading && !error && docs.length > 0 && (
        <div className="space-y-2">
          {docs.map((doc) => (
            <button
              key={doc.id}
              onClick={() => navigate(`/builder/${doc.id}`)}
              className="w-full text-left flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/3 bg-card transition-colors group"
            >
              <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-foreground truncate">{doc.title}</span>
                  <StatusBadge status={doc.status} />
                  {doc.category && (
                    <span className="text-xs text-muted-foreground/70 hidden sm:inline">
                      {CATEGORY_LABELS[doc.category] ?? doc.category}
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground mt-0.5 block">
                  {formatDate(doc.updatedAt)}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
