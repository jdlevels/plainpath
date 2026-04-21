import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft, Plus, AlertCircle, Check,
  Loader2, RefreshCw, Archive, ChevronRight, Save,
} from "lucide-react";
import { useBuilderApi } from "@/hooks/useBuilderApi";
import type {
  BuilderDocumentFull,
  BuilderContent,
  BuilderSection,
  BuilderDocStatus,
  AutosaveStatus,
} from "@/lib/builderTypes";
import { CATEGORY_LABELS } from "@/lib/builderConfig";
import { SectionEditor } from "@/components/builder/SectionEditor";
import { BuilderPagePreview } from "@/components/builder/BuilderPagePreview";

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
  if (sorted.length === 0) return null;
  return (
    <nav data-testid="section-nav" className="w-52 shrink-0 hidden lg:block">
      <div className="sticky top-20 space-y-0.5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 px-2 mb-2">
          Sections <span className="font-normal normal-case tracking-normal">({sorted.length})</span>
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
            <ChevronRight className={`w-3 h-3 shrink-0 transition-opacity ${activeId === s.id ? "opacity-80" : "opacity-30"}`} />
            <span className="truncate">{s.title || "Untitled section"}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

export default function Workspace({ docId }: WorkspaceProps) {
  const [, navigate] = useLocation();
  const api = useBuilderApi();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [doc, setDoc] = useState<BuilderDocumentFull | null>(null);

  // Editable state
  const [title, setTitle] = useState("");
  const [status] = useState<BuilderDocStatus>("draft");
  const [content, setContent] = useState<BuilderContent>({ sections: [] });

  // Autosave
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>("idle");
  const serverVersionRef = useRef<number>(1);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const conflictRef = useRef(false);

  // Section nav active tracking (scroll-spy via IntersectionObserver)
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const intersectingRef = useRef<Set<string>>(new Set());

  // Conflict banner
  const [conflictBanner, setConflictBanner] = useState(false);

  // Archive confirm
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  // Dynamic page title
  useEffect(() => {
    document.title = title ? `${title} — Document Builder — PlainPath` : "Document Builder — PlainPath"
    return () => { document.title = "PlainPath" }
  }, [title])

  // Load document
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.getDocument(docId).then((d) => {
      if (cancelled) return;
      setDoc(d);
      setTitle(d.title);
      setContent(d.content);
      serverVersionRef.current = d.serverVersion;
      const sorted = [...d.content.sections].sort((a, b) => a.order - b.order);
      if (sorted.length > 0) setActiveSectionId(sorted[0].id);
      setLoading(false);
    }).catch((err) => {
      if (cancelled) return;
      setError(err?.status === 404 ? "Document not found." : "Failed to load document.");
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [docId, api.getDocument]);

  // Stable dep: only changes when section IDs or count change — avoids re-connecting
  // the observer on every block edit.
  const sectionIdKey = content.sections.map((s) => s.id).join(",");

  // IntersectionObserver scroll-spy for section nav
  useEffect(() => {
    if (loading || !content.sections.length) return;

    observerRef.current?.disconnect();
    intersectingRef.current = new Set();

    // Snapshot sorted sections at setup time for the callback
    const sortedSnapshot = [...content.sections].sort((a, b) => a.order - b.order);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.getAttribute("data-section-id");
          if (!id) return;
          if (entry.isIntersecting) {
            intersectingRef.current.add(id);
          } else {
            intersectingRef.current.delete(id);
          }
        });
        // Pick the topmost intersecting section
        for (const s of sortedSnapshot) {
          if (intersectingRef.current.has(s.id)) {
            setActiveSectionId(s.id);
            return;
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 },
    );

    sortedSnapshot.forEach((s) => {
      const el = document.getElementById(`section-${s.id}`);
      if (el) {
        el.setAttribute("data-section-id", s.id);
        observer.observe(el);
      }
    });

    observerRef.current = observer;
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, sectionIdKey]);

  // Autosave
  const scheduleAutosave = useCallback(
    (newContent: BuilderContent, newTitle: string, newStatus: string) => {
      if (conflictRef.current) return;
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      setAutosaveStatus("pending");
      autosaveTimerRef.current = setTimeout(async () => {
        setAutosaveStatus("saving");
        try {
          const result = await api.updateDocument(docId, {
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
    [docId, api.updateDocument],
  );

  const saveNow = useCallback(async () => {
    if (conflictRef.current) return;
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    setAutosaveStatus("saving");
    try {
      const result = await api.updateDocument(docId, {
        content,
        title,
        status,
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
  }, [docId, api.updateDocument, content, title, status]);

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
      title: "",
      order: sorted.length,
      blocks: [],
    };
    const newContent = { sections: [...content.sections, newSection] };
    handleContentChange(newContent);
    // Scroll to new section after DOM update
    setTimeout(() => {
      const el = document.getElementById(`section-${newSection.id}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      // Focus the section title input
      const titleInput = el?.querySelector("input[type=text]") as HTMLInputElement;
      titleInput?.focus();
    }, 80);
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
    setShowArchiveConfirm(false);
    try {
      await api.archiveDocument(docId);
      navigate("/builder");
    } catch {
      alert("Failed to archive document. Please try again.");
    }
  }

  function scrollToSection(sectionId: string) {
    setActiveSectionId(sectionId);
    const el = document.getElementById(`section-${sectionId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
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
              onClick={() => window.location.reload()}
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
            title="Back to documents"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            maxLength={200}
            placeholder="Untitled document"
            className="flex-1 bg-transparent border-none outline-none text-lg font-semibold text-foreground placeholder:text-muted-foreground/40 min-w-0"
          />

          <div className="flex items-center gap-2 shrink-0">
            <AutosaveIndicator status={autosaveStatus} />

            <button
              type="button"
              onClick={saveNow}
              disabled={autosaveStatus === "saving" || autosaveStatus === "conflict"}
              title="Save now"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                autosaveStatus === "pending" || autosaveStatus === "error"
                  ? "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 shadow-sm shadow-amber-500/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {autosaveStatus === "saving" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Save
            </button>

            {/* Draft/Final toggle — deferred to Slice 3 (requires snapshot pipeline). Static label only. */}
            <span
              className="px-3 py-1 text-xs font-semibold rounded-full border bg-secondary text-muted-foreground border-border select-none"
              title="Status changes are available in a future update"
            >
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

      {/* Body — split-screen on lg+, single column below */}
      <div className="flex">

        {/* ── LEFT PANE: live document preview (desktop only) ─────────────── */}
        <div className="hidden lg:block w-[55%] shrink-0">
          <div
            className="sticky overflow-y-auto bg-neutral-100 dark:bg-zinc-900/70 border-r border-border"
            style={{ top: "7.5rem", height: "calc(100vh - 7.5rem)" }}
          >
            {/* Stage with centred white page — US Letter proportions */}
            <div className="py-10 px-8 flex justify-center min-h-full">
              <div
                className="w-full max-w-[720px] bg-white rounded-[2px] shadow-md"
                style={{ minHeight: "932px", padding: "72px 64px 96px" }}
              >
                <BuilderPagePreview content={content} title={title} />
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANE: editor controls ──────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex">

          {/* Section nav — shown on lg+ in split mode, sits beside editor */}
          <SectionNav
            sections={content.sections}
            activeId={activeSectionId}
            onSelect={scrollToSection}
          />

          <div data-testid="editor-content" className="flex-1 min-w-0">
          <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
            {sortedSections.length === 0 && (
              <div className="rounded-2xl border-2 border-dashed border-border py-20 text-center">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-5 h-5 text-muted-foreground/60" />
                </div>
                <h3 className="font-medium text-foreground mb-1">No sections yet</h3>
                <p className="text-sm text-muted-foreground mb-5">
                  Add your first section to start building your document.
                </p>
                <button
                  onClick={addSection}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add first section
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
                className="w-full flex items-center justify-center gap-2 py-3.5 border-2 border-dashed border-border hover:border-primary/40 rounded-xl text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" /> Add section
              </button>
            )}
          </div>
          </div>
        </div>
      </div>

      {/* Archive confirm dialog */}
      {showArchiveConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowArchiveConfirm(false); }}
        >
          <div className="bg-background rounded-2xl border border-border shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="font-semibold text-foreground mb-2">Archive this document?</h3>
            <p className="text-sm text-muted-foreground mb-5">
              The document will be removed from your active list. This cannot be undone in this version.
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
