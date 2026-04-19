import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft, Plus, AlertCircle, Check,
  Loader2, RefreshCw, Archive, ChevronRight,
} from "lucide-react";
import { builderApi } from "@/lib/builderApi";
import type {
  BuilderDocumentFull,
  BuilderContent,
  BuilderSection,
  BuilderDocStatus,
  AutosaveStatus,
} from "@/lib/builderTypes";
import { CATEGORY_LABELS } from "@/lib/builderConfig";
import { SectionEditor } from "@/components/builder/SectionEditor";

interface WorkspaceProps {
  docId: string;
}

function AutosaveIndicator({ status }: { status: AutosaveStatus }) {
  if (status === "idle") return null;
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {status === "saving" || status === "pending" ? (
        <><Loader2 className="w-3 h-3 animate-spin" /> Saving…</>
      ) : status === "saved" ? (
        <><Check className="w-3 h-3 text-green-500" /> Saved</>
      ) : status === "conflict" ? (
        <><AlertCircle className="w-3 h-3 text-amber-500" /> Conflict</>
      ) : status === "error" ? (
        <><AlertCircle className="w-3 h-3 text-destructive" /> Save failed</>
      ) : null}
    </div>
  );
}

function SectionNav({
  sections,
  activeId,
  onSelect,
}: {
  sections: BuilderSection[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  const sorted = [...sections].sort((a, b) => a.order - b.order);
  return (
    <nav className="w-56 shrink-0 hidden lg:block">
      <div className="sticky top-20 space-y-0.5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 px-2 mb-2">
          Sections
        </p>
        {sorted.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={`w-full text-left flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-lg transition-colors ${
              activeId === s.id
                ? "text-primary bg-primary/8 font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <ChevronRight className="w-3 h-3 shrink-0 opacity-60" />
            <span className="truncate">{s.title || "Untitled section"}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

export default function Workspace({ docId }: WorkspaceProps) {
  const [, navigate] = useLocation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [doc, setDoc] = useState<BuilderDocumentFull | null>(null);

  // Editable state
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<BuilderDocStatus>("draft");
  const [content, setContent] = useState<BuilderContent>({ sections: [] });

  // Autosave
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>("idle");
  const serverVersionRef = useRef<number>(1);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const conflictRef = useRef(false);

  // Section nav active tracking
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  // Conflict banner
  const [conflictBanner, setConflictBanner] = useState(false);

  // Archive confirm
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  // Load document
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    builderApi.getDocument(docId).then((d) => {
      if (cancelled) return;
      setDoc(d);
      setTitle(d.title);
      setStatus(d.status as BuilderDocStatus);
      setContent(d.content);
      serverVersionRef.current = d.serverVersion;
      if (d.content.sections.length > 0) {
        const sorted = [...d.content.sections].sort((a, b) => a.order - b.order);
        setActiveSectionId(sorted[0].id);
      }
      setLoading(false);
    }).catch((err) => {
      if (cancelled) return;
      setError(err.status === 404 ? "Document not found." : "Failed to load document.");
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [docId]);

  // Autosave implementation
  const scheduleAutosave = useCallback(
    (newContent: BuilderContent, newTitle: string, newStatus: string) => {
      if (conflictRef.current) return;
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      setAutosaveStatus("pending");
      autosaveTimerRef.current = setTimeout(async () => {
        setAutosaveStatus("saving");
        try {
          const result = await builderApi.updateDocument(docId, {
            content: newContent,
            title: newTitle,
            status: newStatus,
            server_version: serverVersionRef.current,
          });
          serverVersionRef.current = result.serverVersion;
          setAutosaveStatus("saved");
          setTimeout(() => setAutosaveStatus("idle"), 2500);
        } catch (err: any) {
          if (err?.status === 409) {
            conflictRef.current = true;
            setAutosaveStatus("conflict");
            setConflictBanner(true);
          } else {
            setAutosaveStatus("error");
          }
        }
      }, 2000);
    },
    [docId],
  );

  function handleContentChange(newContent: BuilderContent) {
    setContent(newContent);
    scheduleAutosave(newContent, title, status);
  }

  function handleTitleChange(newTitle: string) {
    setTitle(newTitle);
    scheduleAutosave(content, newTitle, status);
  }

  // Section operations
  function addSection() {
    const sorted = [...content.sections].sort((a, b) => a.order - b.order);
    const newSection: BuilderSection = {
      id: crypto.randomUUID(),
      title: "New Section",
      order: sorted.length,
      blocks: [],
    };
    const newContent = { sections: [...content.sections, newSection] };
    handleContentChange(newContent);
    setTimeout(() => {
      document.getElementById(`section-${newSection.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }

  function updateSection(sectionId: string, updated: BuilderSection) {
    handleContentChange({
      sections: content.sections.map((s) => (s.id === sectionId ? updated : s)),
    });
  }

  function deleteSection(sectionId: string) {
    const remaining = content.sections
      .filter((s) => s.id !== sectionId)
      .map((s, i) => ({ ...s, order: i }));
    handleContentChange({ sections: remaining });
  }

  function moveSection(sectionId: string, direction: "up" | "down") {
    const sorted = [...content.sections].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((s) => s.id === sectionId);
    if (idx === -1) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;
    const reordered = sorted.map((s, i) => {
      if (i === idx) return { ...sorted[targetIdx], order: i };
      if (i === targetIdx) return { ...sorted[idx], order: i };
      return { ...s, order: i };
    });
    handleContentChange({ sections: reordered });
  }

  async function handleArchive() {
    try {
      await builderApi.archiveDocument(docId);
      navigate("/builder");
    } catch {
      alert("Failed to archive document. Please try again.");
    }
    setShowArchiveConfirm(false);
  }

  function handleReload() {
    window.location.reload();
  }

  function scrollToSection(sectionId: string) {
    setActiveSectionId(sectionId);
    document.getElementById(`section-${sectionId}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  // Loading & error states
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-4" />
        <p className="text-foreground font-medium mb-2">{error}</p>
        <button
          onClick={() => navigate("/builder")}
          className="text-sm text-muted-foreground hover:text-foreground underline"
        >
          Back to Builder
        </button>
      </div>
    );
  }

  const sortedSections = [...content.sections].sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-background">
      {/* Conflict banner */}
      {conflictBanner && (
        <div className="sticky top-16 z-30 bg-amber-50 dark:bg-amber-950/50 border-b border-amber-200 dark:border-amber-800 px-4 py-2.5">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              This document was modified in another session. Reload to continue editing.
            </div>
            <button
              onClick={handleReload}
              className="flex items-center gap-1.5 text-sm font-medium text-amber-900 dark:text-amber-200 hover:text-amber-700 shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reload
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-16 z-20 border-b border-border/50 bg-background/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate("/builder")}
            className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            maxLength={200}
            placeholder="Document title"
            className="flex-1 bg-transparent border-none outline-none text-lg font-semibold text-foreground placeholder:text-muted-foreground/40 min-w-0"
          />

          <div className="flex items-center gap-2 shrink-0">
            <AutosaveIndicator status={autosaveStatus} />

            {/* Draft/Final toggle — intentionally hidden in Slice 1.
                The draft→final transition requires a builder_document_versions snapshot.
                That behavior is deferred to Slice 2. */}
            <span className="px-3 py-1 text-xs font-semibold rounded-full border bg-secondary text-muted-foreground border-border select-none">
              Draft
            </span>

            {doc?.category && (
              <span className="hidden sm:inline px-2.5 py-1 text-xs bg-secondary text-muted-foreground rounded-full border border-border">
                {CATEGORY_LABELS[doc.category] ?? doc.category}
              </span>
            )}

            <button
              onClick={() => setShowArchiveConfirm(true)}
              title="Archive document"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Archive className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-4 py-8 flex gap-8">
        <SectionNav
          sections={content.sections}
          activeId={activeSectionId}
          onSelect={scrollToSection}
        />

        <div className="flex-1 min-w-0 space-y-4">
          {sortedSections.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-border py-16 text-center">
              <p className="text-muted-foreground mb-4">No sections yet.</p>
              <button
                onClick={addSection}
                className="flex items-center gap-2 mx-auto text-sm text-primary hover:text-primary/80 font-medium"
              >
                <Plus className="w-4 h-4" /> Add your first section
              </button>
            </div>
          )}

          {sortedSections.map((section, i) => (
            <SectionEditor
              key={section.id}
              section={section}
              isFirst={i === 0}
              isLast={i === sortedSections.length - 1}
              onChange={(updated) => updateSection(section.id, updated)}
              onMoveUp={() => moveSection(section.id, "up")}
              onMoveDown={() => moveSection(section.id, "down")}
              onDelete={() => deleteSection(section.id)}
            />
          ))}

          {sortedSections.length > 0 && (
            <button
              onClick={addSection}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-border hover:border-primary/40 rounded-xl text-muted-foreground hover:text-primary transition-colors text-sm"
            >
              <Plus className="w-4 h-4" /> Add section
            </button>
          )}
        </div>
      </div>

      {/* Archive confirm dialog */}
      {showArchiveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-background rounded-2xl border border-border shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="font-semibold text-foreground mb-2">Archive document?</h3>
            <p className="text-sm text-muted-foreground mb-5">
              This document will be removed from your active list. Archiving cannot be undone in this version.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowArchiveConfirm(false)}
                className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleArchive}
                className="px-4 py-2 text-sm rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors font-medium"
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
