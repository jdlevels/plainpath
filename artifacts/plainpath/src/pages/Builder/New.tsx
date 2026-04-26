import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft, FileText, ClipboardList, Users, ShieldAlert,
  GraduationCap, GitBranch, HardHat, AlertCircle, CheckSquare,
  Loader2, ChevronRight,
} from "lucide-react";
import { useBuilderApi } from "@/hooks/useBuilderApi";
import { BUILDER_CATEGORIES } from "@/lib/builderConfig";
import type { BuilderCategory } from "@/lib/builderConfig";
import { BUILTIN_TEMPLATES } from "@/lib/builderTemplates";
import type { BuiltinTemplate } from "@/lib/builderTemplates";
import { generateDraftContent } from "@/lib/templateQuestions";

type Mode = "choose" | "blank" | "questions";

// ─── Icon map ─────────────────────────────────────────────────────────────────

const TEMPLATE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "sop":              ClipboardList,
  "onboarding":       Users,
  "policy":           ShieldAlert,
  "training-manual":  GraduationCap,
  "process-guide":    GitBranch,
  "safety-manual":    HardHat,
  "incident-report":  AlertCircle,
  "checklist":        CheckSquare,
};

// ─── Blank create helpers ──────────────────────────────────────────────────────

function createEmptyContent() {
  return {
    sections: [{ id: crypto.randomUUID(), title: "Overview", order: 0, blocks: [] }],
  };
}

function CategoryPicker({ selected, onSelect }: { selected: BuilderCategory | ""; onSelect: (c: BuilderCategory) => void }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {BUILDER_CATEGORIES.map((cat) => (
        <button
          key={cat.value}
          type="button"
          onClick={() => onSelect(cat.value)}
          className={`p-3 rounded-lg border text-left transition-colors text-sm ${
            selected === cat.value
              ? "border-primary bg-primary/8 text-primary font-medium"
              : "border-border bg-card text-muted-foreground hover:border-foreground/40 hover:text-foreground"
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function BuilderNew() {
  const [, navigate] = useLocation();
  const api = useBuilderApi();

  const [mode, setMode] = useState<Mode>("choose");

  // ── Blank flow ─────────────────────────────────────────────────────────────
  const [blankCategory, setBlankCategory] = useState<BuilderCategory | "">("");
  const [blankTitle, setBlankTitle] = useState("");
  const blankTitleRef = useRef<HTMLInputElement>(null);

  // ── Questions flow ─────────────────────────────────────────────────────────
  const [selectedTemplate, setSelectedTemplate] = useState<BuiltinTemplate | null>(null);
  const [docTitle, setDocTitle] = useState("");
  const [docCategory, setDocCategory] = useState<BuilderCategory | "">("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const docTitleRef = useRef<HTMLInputElement>(null);

  // ── Submission ─────────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "New Document — Document Builder — PlainPath";
    return () => { document.title = "PlainPath"; };
  }, []);

  useEffect(() => {
    if (mode === "blank") setTimeout(() => blankTitleRef.current?.focus(), 50);
    if (mode === "questions") setTimeout(() => docTitleRef.current?.focus(), 50);
  }, [mode]);

  // ── Template selection → questions mode ────────────────────────────────────
  function handlePickTemplate(t: BuiltinTemplate) {
    setSelectedTemplate(t);
    setDocTitle(t.label);
    setDocCategory(t.dbCategory);
    setAnswers({});
    setSubmitError(null);
    setMode("questions");
  }

  // ── Create from template ───────────────────────────────────────────────────
  async function handleCreateFromTemplate() {
    if (!selectedTemplate || !docTitle.trim() || !docCategory) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const content = generateDraftContent(selectedTemplate.key, answers);
      const doc = await api.createDocument({
        title: docTitle.trim(),
        category: docCategory,
        source: "template",
        content,
      });
      navigate(`/builder/${doc.id}`);
    } catch (err: any) {
      const msg = err?.data?.message ?? err?.message ?? null;
      setSubmitError(msg && msg !== "Request failed" ? msg : "Failed to create document. Please try again.");
      setSubmitting(false);
    }
  }

  // ── Create blank ───────────────────────────────────────────────────────────
  async function handleCreateBlank() {
    if (!blankTitle.trim() || !blankCategory) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const doc = await api.createDocument({
        title: blankTitle.trim(),
        category: blankCategory,
        source: "blank",
        content: createEmptyContent(),
      });
      navigate(`/builder/${doc.id}`);
    } catch (err: any) {
      const msg = err?.data?.message ?? err?.message ?? null;
      setSubmitError(msg && msg !== "Request failed" ? msg : "Failed to create document. Please try again.");
      setSubmitting(false);
    }
  }

  // ── Mode: Choose ──────────────────────────────────────────────────────────

  if (mode === "choose") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
        <button
          type="button"
          onClick={() => navigate("/builder")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to documents
        </button>

        <h1 className="text-2xl font-bold text-foreground mb-1">New document</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Choose a template to get a structured first draft, or start from scratch.
        </p>

        {/* Template grid */}
        <div className="grid sm:grid-cols-2 gap-3 mb-5">
          {BUILTIN_TEMPLATES.map((t) => {
            const Icon = TEMPLATE_ICONS[t.key] ?? FileText;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => handlePickTemplate(t)}
                className="group p-5 rounded-2xl border border-border hover:border-primary/50 bg-card hover:bg-primary/3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                    <Icon className="w-4.5 h-4.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-foreground text-sm leading-snug">{t.label}</p>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{t.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Start from blank */}
        <div className="border-t border-border/50 pt-5">
          <button
            type="button"
            onClick={() => { setSubmitError(null); setMode("blank"); }}
            className="group w-full flex items-center gap-3 px-5 py-3.5 rounded-xl border border-dashed border-border hover:border-foreground/30 hover:bg-secondary/30 transition-all text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-secondary transition-colors">
              <FileText className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Start from blank</p>
              <p className="text-xs text-muted-foreground">Build your own structure from scratch.</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // ── Mode: Blank ────────────────────────────────────────────────────────────

  if (mode === "blank") {
    const canCreate = blankTitle.trim().length > 0 && blankCategory !== "";
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 sm:py-14">
        <button
          type="button"
          onClick={() => { setMode("choose"); setSubmitError(null); }}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-2xl font-bold text-foreground mb-8">New blank document</h1>
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleCreateBlank(); }}>
          <div>
            <label htmlFor="blank-title" className="text-sm font-medium text-foreground block mb-2">
              Document title <span className="text-destructive">*</span>
            </label>
            <input
              ref={blankTitleRef}
              id="blank-title"
              type="text"
              value={blankTitle}
              onChange={(e) => setBlankTitle(e.target.value)}
              placeholder="e.g. Engineering Onboarding Checklist"
              maxLength={200}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary transition-colors text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              Category <span className="text-destructive">*</span>
            </label>
            <CategoryPicker selected={blankCategory} onSelect={setBlankCategory} />
          </div>
          {submitError && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 shrink-0" /> {submitError}
            </div>
          )}
          <button
            type="submit"
            disabled={!canCreate || submitting}
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Create document
          </button>
        </form>
      </div>
    );
  }

  // ── Mode: Guided Questions ─────────────────────────────────────────────────

  if (!selectedTemplate) return null;
  const questions = selectedTemplate.questions;
  const Icon = TEMPLATE_ICONS[selectedTemplate.key] ?? FileText;
  const canCreate = docTitle.trim().length > 0 && docCategory !== "";

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 sm:py-14">
      <button
        type="button"
        onClick={() => { setMode("choose"); setSubmitError(null); }}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to templates
      </button>

      {/* Template badge */}
      <div className="flex items-center gap-2 mb-5">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/8 border border-primary/20">
          <Icon className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium text-primary">{selectedTemplate.label}</span>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-foreground mb-1">Personalize your draft</h1>
      <p className="text-sm text-muted-foreground mb-7">
        Answer what you know. PlainPath will structure the draft around your inputs. All fields are optional.
      </p>

      <div className="space-y-6">
        {/* Document title */}
        <div>
          <label htmlFor="doc-title" className="text-sm font-medium text-foreground block mb-1.5">
            Document title <span className="text-destructive">*</span>
          </label>
          <input
            ref={docTitleRef}
            id="doc-title"
            type="text"
            value={docTitle}
            onChange={(e) => setDocTitle(e.target.value)}
            placeholder={`e.g. ${selectedTemplate.label}`}
            maxLength={200}
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary transition-colors text-sm"
          />
        </div>

        {/* Category */}
        <div>
          <label className="text-sm font-medium text-foreground block mb-2">
            Category <span className="text-destructive">*</span>
          </label>
          <CategoryPicker selected={docCategory} onSelect={setDocCategory} />
        </div>

        {/* Guided questions */}
        <div className="border-t border-border/50 pt-6 space-y-5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Guided questions</span>
            <span className="text-xs text-muted-foreground/60">— all optional</span>
          </div>

          {questions.map((q) => (
            <div key={q.id}>
              <label htmlFor={`q-${q.id}`} className="text-sm font-medium text-foreground block mb-1">
                {q.label}
              </label>
              {q.hint && (
                <p className="text-xs text-muted-foreground mb-1.5">{q.hint}</p>
              )}
              {q.multiline ? (
                <textarea
                  id={`q-${q.id}`}
                  value={answers[q.id] ?? ""}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                  placeholder={q.placeholder}
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary transition-colors text-sm resize-y"
                />
              ) : (
                <input
                  id={`q-${q.id}`}
                  type="text"
                  value={answers[q.id] ?? ""}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                  placeholder={q.placeholder}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary transition-colors text-sm"
                />
              )}
            </div>
          ))}
        </div>

        {submitError && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4 shrink-0" /> {submitError}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            disabled={submitting}
            onClick={() => { setMode("choose"); setSubmitError(null); }}
            className="px-5 py-2.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/40 disabled:opacity-40 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canCreate || submitting}
            onClick={handleCreateFromTemplate}
            className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Create draft
          </button>
        </div>
      </div>
    </div>
  );
}
