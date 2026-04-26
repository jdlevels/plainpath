import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft, AlertCircle, Check,
  Loader2, RefreshCw, Archive, Save,
  Sparkles, AlignLeft, Pencil, Palette, Download,
} from "lucide-react";
import { useBuilderApi } from "@/hooks/useBuilderApi";
import type {
  BuilderDocumentFull,
  BuilderContent,
  BuilderSection,
  BuilderBlock,
  BuilderDocStatus,
  AutosaveStatus,
  KnownBlockType,
} from "@/lib/builderTypes";
import { BLOCK_TYPE_LABELS, KNOWN_BLOCK_TYPES } from "@/lib/builderTypes";
import { CATEGORY_LABELS } from "@/lib/builderConfig";
import { BuilderPagePreview } from "@/components/builder/BuilderPagePreview";
import { BlockEditor } from "@/components/builder/BlockEditor";
import { getDefaultPayload } from "@/components/builder/blockDefaults";
import { AiGuidePanel } from "@/components/builder/AiGuidePanel";
import { OutlinePanel } from "@/components/builder/OutlinePanel";
import { StylePanel } from "@/components/builder/StylePanel";
import { ExportPanel } from "@/components/builder/ExportPanel";

interface WorkspaceProps {
  docId: string;
}

type TabId = "guide" | "outline" | "edit" | "style" | "export";

interface BrandingState {
  companyName: string;
  brandColor: string;
  headerStyle: "minimal" | "banner" | "classic";
  footerText: string;
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

const TABS: Array<{ id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "guide",   label: "Guide",   icon: Sparkles  },
  { id: "outline", label: "Outline", icon: AlignLeft },
  { id: "edit",    label: "Edit",    icon: Pencil    },
  { id: "style",   label: "Style",   icon: Palette   },
  { id: "export",  label: "Export",  icon: Download  },
];

export default function Workspace({ docId }: WorkspaceProps) {
  const [, navigate] = useLocation();
  const api = useBuilderApi();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [doc, setDoc] = useState<BuilderDocumentFull | null>(null);

  const [title, setTitle] = useState("");
  const [status] = useState<BuilderDocStatus>("draft");
  const [content, setContent] = useState<BuilderContent>({ sections: [] });

  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>("idle");
  const serverVersionRef = useRef<number>(1);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const conflictRef = useRef(false);

  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const intersectingRef = useRef<Set<string>>(new Set());

  const [conflictBanner, setConflictBanner] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  // Right panel
  const [activeTab, setActiveTab] = useState<TabId>("outline");
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  // Local branding state (Phase 1: not persisted)
  const [branding, setBranding] = useState<BrandingState>({
    companyName: "",
    brandColor: "#1d4ed8",
    headerStyle: "minimal",
    footerText: "",
  });

  useEffect(() => {
    document.title = title ? `${title} — Document Builder — PlainPath` : "Document Builder — PlainPath";
    return () => { document.title = "PlainPath"; };
  }, [title]);

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

  const sectionIdKey = content.sections.map((s) => s.id).join(",");

  useEffect(() => {
    if (loading || !content.sections.length) return;
    observerRef.current?.disconnect();
    intersectingRef.current = new Set();
    const sortedSnapshot = [...content.sections].sort((a, b) => a.order - b.order);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.getAttribute("data-section-id");
          if (!id) return;
          if (entry.isIntersecting) intersectingRef.current.add(id);
          else intersectingRef.current.delete(id);
        });
        for (const s of sortedSnapshot) {
          if (intersectingRef.current.has(s.id)) { setActiveSectionId(s.id); return; }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 },
    );
    sortedSnapshot.forEach((s) => {
      const el = document.getElementById(`section-${s.id}`);
      if (el) { el.setAttribute("data-section-id", s.id); observer.observe(el); }
    });
    observerRef.current = observer;
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, sectionIdKey]);

  const scheduleAutosave = useCallback(
    (newContent: BuilderContent, newTitle: string, newStatus: string) => {
      if (conflictRef.current) return;
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      setAutosaveStatus("pending");
      autosaveTimerRef.current = setTimeout(async () => {
        setAutosaveStatus("saving");
        try {
          const result = await api.updateDocument(docId, {
            content: newContent, title: newTitle, status: newStatus,
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
    if (autosaveTimerRef.current) { clearTimeout(autosaveTimerRef.current); autosaveTimerRef.current = null; }
    setAutosaveStatus("saving");
    try {
      const result = await api.updateDocument(docId, {
        content, title, status, server_version: serverVersionRef.current,
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

  // ── Section operations ────────────────────────────────────────────────────

  function addSection() {
    const sorted = [...content.sections].sort((a, b) => a.order - b.order);
    const newSection: BuilderSection = {
      id: crypto.randomUUID(), title: "", order: sorted.length, blocks: [],
    };
    handleContentChange({ sections: [...content.sections, newSection] });
    setTimeout(() => {
      const el = document.getElementById(`section-${newSection.id}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
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
    if (selectedSectionId === sectionId) { setSelectedSectionId(null); setSelectedBlockId(null); }
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

  function updateSectionTitle(sectionId: string, newTitle: string) {
    const section = content.sections.find((s) => s.id === sectionId);
    if (!section) return;
    updateSection(sectionId, { ...section, title: newTitle });
  }

  // ── Block operations ──────────────────────────────────────────────────────

  function addBlock(sectionId: string, type: KnownBlockType) {
    const section = content.sections.find((s) => s.id === sectionId);
    if (!section) return;
    const maxOrder = section.blocks.length > 0 ? Math.max(...section.blocks.map((b) => b.order)) : -1;
    const newBlock: BuilderBlock = {
      id: crypto.randomUUID(), type, order: maxOrder + 1, payload: getDefaultPayload(type),
    };
    const updated = { ...section, blocks: [...section.blocks, newBlock] };
    updateSection(sectionId, updated);
    setSelectedSectionId(sectionId);
    setSelectedBlockId(newBlock.id);
    setActiveTab("edit");
  }

  function updateBlock(sectionId: string, blockId: string, payload: Record<string, unknown>) {
    const section = content.sections.find((s) => s.id === sectionId);
    if (!section) return;
    const updated = {
      ...section,
      blocks: section.blocks.map((b) => (b.id === blockId ? { ...b, payload } : b)),
    };
    updateSection(sectionId, updated);
  }

  function deleteBlock(sectionId: string, blockId: string) {
    const section = content.sections.find((s) => s.id === sectionId);
    if (!section) return;
    const remaining = section.blocks
      .filter((b) => b.id !== blockId)
      .map((b, i) => ({ ...b, order: i }));
    updateSection(sectionId, { ...section, blocks: remaining });
    if (selectedBlockId === blockId) { setSelectedBlockId(null); }
  }

  function moveBlock(sectionId: string, blockId: string, direction: "up" | "down") {
    const section = content.sections.find((s) => s.id === sectionId);
    if (!section) return;
    const sorted = [...section.blocks].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((b) => b.id === blockId);
    if (idx === -1) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;
    const reordered = sorted.map((b, i) => {
      if (i === idx) return { ...sorted[targetIdx], order: i };
      if (i === targetIdx) return { ...sorted[idx], order: i };
      return { ...b, order: i };
    });
    updateSection(sectionId, { ...section, blocks: reordered });
  }

  // ── Block selection (from preview click) ─────────────────────────────────

  function handleBlockSelect(sectionId: string, blockId: string) {
    setSelectedSectionId(sectionId);
    setSelectedBlockId(blockId);
    setActiveTab("edit");
  }

  // ── Misc ──────────────────────────────────────────────────────────────────

  async function handleArchive() {
    setShowArchiveConfirm(false);
    try {
      await api.archiveDocument(docId);
      navigate("/builder");
    } catch {
      alert("Failed to archive document. Please try again.");
    }
  }

  function handleDownload() {
    const sorted = [...content.sections].sort((a, b) => a.order - b.order);
    const lines: string[] = [];
    if (title.trim()) lines.push(title.trim(), "");
    for (const section of sorted) {
      if (section.title.trim()) lines.push(`\n${section.title.trim()}`, "");
      const sortedBlocks = [...section.blocks].sort((a, b) => a.order - b.order);
      for (const block of sortedBlocks) {
        const p = block.payload;
        if (block.type === "heading" || block.type === "paragraph" || block.type === "note") {
          if (typeof p.text === "string" && p.text.trim()) lines.push(p.text.trim(), "");
        } else if (block.type === "bullet-list" && Array.isArray(p.items)) {
          for (const item of p.items as string[]) {
            if (typeof item === "string" && item.trim()) lines.push(`• ${item.trim()}`);
          }
          lines.push("");
        } else if (block.type === "numbered-list" && Array.isArray(p.items)) {
          (p.items as string[]).forEach((item, idx) => {
            if (typeof item === "string" && item.trim()) lines.push(`${idx + 1}. ${item.trim()}`);
          });
          lines.push("");
        } else if (block.type === "checklist" && Array.isArray(p.items)) {
          for (const item of p.items as { text: string; checked?: boolean }[]) {
            if (item?.text?.trim()) lines.push(`[${item.checked ? "x" : " "}] ${item.text.trim()}`);
          }
          lines.push("");
        }
      }
    }
    const text = lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(title.trim() || "document").replace(/[^a-z0-9]/gi, "-").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function scrollToSection(sectionId: string) {
    setActiveSectionId(sectionId);
    const el = document.getElementById(`section-${sectionId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ── Derived: selected block ───────────────────────────────────────────────

  const selectedSection = selectedSectionId
    ? content.sections.find((s) => s.id === selectedSectionId) ?? null
    : null;

  const selectedBlock = selectedSection && selectedBlockId
    ? selectedSection.blocks.find((b) => b.id === selectedBlockId) ?? null
    : null;

  const selectedBlockSorted = selectedSection
    ? [...selectedSection.blocks].sort((a, b) => a.order - b.order)
    : [];

  const selectedBlockIdx = selectedBlock
    ? selectedBlockSorted.findIndex((b) => b.id === selectedBlockId)
    : -1;

  // ── Loading / error ───────────────────────────────────────────────────────

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
        <button onClick={() => navigate("/builder")} className="text-sm text-muted-foreground hover:text-foreground underline">
          Back to Builder
        </button>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

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
            <button onClick={() => window.location.reload()} className="flex items-center gap-1.5 text-sm font-medium text-amber-900 dark:text-amber-200 hover:text-amber-700 shrink-0">
              <RefreshCw className="w-3.5 h-3.5" /> Reload
            </button>
          </div>
        </div>
      )}

      {/* Command bar */}
      <div className="sticky top-16 z-20 border-b border-border/70 bg-background/98 backdrop-blur-sm shadow-sm">
        <div className="px-4 py-2.5 flex items-center gap-3">
          <button
            onClick={() => navigate("/builder")}
            className="shrink-0 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
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
              {autosaveStatus === "saving" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save
            </button>

            <span className="px-3 py-1 text-xs font-semibold rounded-full border bg-secondary text-muted-foreground border-border select-none" title="Status changes are available in a future update">
              Draft
            </span>

            {doc?.category && (
              <span className="hidden sm:inline px-2.5 py-1 text-xs bg-secondary text-muted-foreground rounded-full border border-border">
                {CATEGORY_LABELS[doc.category] ?? doc.category}
              </span>
            )}

            <button onClick={() => setShowArchiveConfirm(true)} title="Archive document" className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
              <Archive className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Body — split on lg+ */}
      <div className="flex" style={{ height: "calc(100vh - 7.5rem)" }}>

        {/* LEFT: white page preview */}
        <div className="hidden lg:block w-[58%] shrink-0 overflow-y-auto bg-neutral-100 dark:bg-zinc-900/70 border-r border-border">
          <div className="py-10 px-8 flex justify-center min-h-full">
            <div
              className="w-full max-w-[720px] bg-white rounded-[2px] shadow-md"
              style={{ minHeight: "932px", padding: "72px 64px 96px" }}
            >
              <BuilderPagePreview
                content={content}
                title={title}
                selectedBlockId={selectedBlockId}
                onBlockSelect={handleBlockSelect}
              />
            </div>
          </div>
        </div>

        {/* RIGHT: tabbed panel */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-border/70 bg-background/95 shrink-0">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === "guide" && (
              <AiGuidePanel selectedBlock={selectedBlock} category={doc?.category} />
            )}

            {activeTab === "outline" && (
              <OutlinePanel
                sections={content.sections}
                activeSectionId={activeSectionId}
                selectedBlockId={selectedBlockId}
                onSectionClick={(sectionId) => { scrollToSection(sectionId); }}
                onAddSection={addSection}
                onMoveSection={moveSection}
                onDeleteSection={deleteSection}
                onUpdateSectionTitle={updateSectionTitle}
                onAddBlock={addBlock}
                onSelectBlock={(sectionId, blockId) => { setSelectedSectionId(sectionId); setSelectedBlockId(blockId); setActiveTab("edit"); }}
                onDeleteBlock={deleteBlock}
              />
            )}

            {activeTab === "edit" && (
              <div className="flex flex-col h-full overflow-y-auto">
                {!selectedBlock || !selectedSection ? (
                  <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
                      <Pencil className="w-5 h-5 text-muted-foreground/60" />
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">No block selected</p>
                    <p className="text-xs text-muted-foreground">
                      Click any block on the document page, or use the Outline tab to add and select a block.
                    </p>
                  </div>
                ) : (
                  <div className="px-4 py-4 space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                        Editing: {BLOCK_TYPE_LABELS[selectedBlock.type as keyof typeof BLOCK_TYPE_LABELS] ?? selectedBlock.type}
                      </span>
                      <span className="text-[10px] text-muted-foreground/40">in "{selectedSection.title || "Untitled section"}"</span>
                    </div>
                    <BlockEditor
                      block={selectedBlock}
                      isFirst={selectedBlockIdx === 0}
                      isLast={selectedBlockIdx === selectedBlockSorted.length - 1}
                      onChange={(payload) => updateBlock(selectedSectionId!, selectedBlockId!, payload)}
                      onMoveUp={() => moveBlock(selectedSectionId!, selectedBlockId!, "up")}
                      onMoveDown={() => moveBlock(selectedSectionId!, selectedBlockId!, "down")}
                      onDelete={() => { deleteBlock(selectedSectionId!, selectedBlockId!); }}
                    />
                    <button
                      onClick={() => { setSelectedBlockId(null); setSelectedSectionId(null); }}
                      className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
                    >
                      Deselect block
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "style" && (
              <StylePanel branding={branding} onChange={setBranding} />
            )}

            {activeTab === "export" && (
              <ExportPanel onDownloadTxt={handleDownload} documentTitle={title} />
            )}
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
              <button onClick={() => setShowArchiveConfirm(false)} className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors">
                Cancel
              </button>
              <button onClick={handleArchive} className="px-4 py-2 text-sm rounded-lg bg-destructive text-destructive-foreground font-medium hover:bg-destructive/90 transition-colors">
                Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
