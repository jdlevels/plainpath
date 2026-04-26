import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft, FileText, LayoutTemplate, Loader2,
  CheckCircle2, AlertCircle, Search, ChevronRight,
} from "lucide-react";
import type { BuilderTemplate } from "@/lib/builderTypes";
import { useBuilderApi } from "@/hooks/useBuilderApi";
import { BUILDER_CATEGORIES, CATEGORY_LABELS } from "@/lib/builderConfig";
import type { BuilderCategory } from "@/lib/builderConfig";
import { getQuestionsForCategory, applyAnswersToContent } from "@/lib/templateQuestions";

type Mode = "choose" | "blank" | "template" | "questions";

function createEmptyContent() {
  return {
    sections: [
      {
        id: crypto.randomUUID(),
        title: "Overview",
        order: 0,
        blocks: [],
      },
    ],
  };
}

function CategoryPicker({
  selected,
  onSelect,
}: {
  selected: BuilderCategory | "";
  onSelect: (c: BuilderCategory) => void;
}) {
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

export default function BuilderNew() {
  const [, navigate] = useLocation();
  const api = useBuilderApi();
  const [mode, setMode] = useState<Mode>("choose");
  const titleRef = useRef<HTMLInputElement>(null);
  const questionsTitleRef = useRef<HTMLInputElement>(null);

  // ── Blank flow ─────────────────────────────────────────────────────────────
  const [blankCategory, setBlankCategory] = useState<BuilderCategory | "">("");
  const [blankTitle, setBlankTitle] = useState("");

  // ── Template flow ──────────────────────────────────────────────────────────
  const [templates, setTemplates] = useState<BuilderTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState(false);
  const [templateSearch, setTemplateSearch] = useState("");
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState<string>("all");
  const [selectedTemplate, setSelectedTemplate] = useState<BuilderTemplate | null>(null);

  // ── Questions flow ─────────────────────────────────────────────────────────
  const [questionsTitle, setQuestionsTitle] = useState("");
  const [questionsCategory, setQuestionsCategory] = useState<BuilderCategory | "">("");
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // ── Shared submitting state ────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "New Document — Document Builder — PlainPath";
    return () => { document.title = "PlainPath"; };
  }, []);

  // Auto-focus title when entering blank mode
  useEffect(() => {
    if (mode === "blank") {
      setTimeout(() => titleRef.current?.focus(), 50);
    }
  }, [mode]);

  // Auto-focus title when entering questions mode
  useEffect(() => {
    if (mode === "questions") {
      setTimeout(() => questionsTitleRef.current?.focus(), 50);
    }
  }, [mode]);

  // Load templates when template mode is entered
  useEffect(() => {
    if (mode === "template" && templates.length === 0 && !templatesLoading && !templatesError) {
      setTemplatesLoading(true);
      setTemplatesError(false);
      api.listTemplates().then((t) => {
        setTemplates(t);
        setTemplatesLoading(false);
      }).catch(() => {
        setTemplatesError(true);
        setTemplatesLoading(false);
      });
    }
  }, [mode, templates.length, templatesLoading, templatesError, api.listTemplates]);

  // ── Actions ────────────────────────────────────────────────────────────────

  function handleSelectTemplate(t: BuilderTemplate) {
    setSelectedTemplate(t);
  }

  function handleUseTemplate() {
    if (!selectedTemplate) return;
    setQuestionsTitle(selectedTemplate.name);
    setQuestionsCategory(selectedTemplate.category as BuilderCategory);
    const questions = getQuestionsForCategory(selectedTemplate.category);
    const defaults: Record<string, string> = {};
    for (const q of questions) {
      if (q.defaultValue) defaults[q.id] = q.defaultValue;
    }
    setAnswers(defaults);
    setSubmitError(null);
    setMode("questions");
  }

  const canCreateBlank = blankTitle.trim().length > 0 && blankCategory !== "";
  const canCreateFromQuestions = questionsTitle.trim().length > 0 && questionsCategory !== "";

  async function handleCreateBlank() {
    if (!canCreateBlank) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const doc = await api.createDocument({
        title: blankTitle.trim(),
        category: blankCategory as BuilderCategory,
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

  async function handleCreateFromTemplate(skipQuestions = false) {
    if (!selectedTemplate || !canCreateFromQuestions) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const finalContent = skipQuestions
        ? selectedTemplate.content
        : applyAnswersToContent(selectedTemplate.content, answers, selectedTemplate.category);

      const doc = await api.createDocument({
        title: questionsTitle.trim(),
        category: questionsCategory as BuilderCategory,
        source: "template",
        templateId: selectedTemplate.id,
        content: finalContent,
      });
      navigate(`/builder/${doc.id}`);
    } catch (err: any) {
      const msg = err?.data?.message ?? err?.message ?? null;
      setSubmitError(msg && msg !== "Request failed" ? msg : "Failed to create document. Please try again.");
      setSubmitting(false);
    }
  }

  // Template filtering
  const filteredTemplates = templates.filter((t) => {
    const matchesSearch =
      templateSearch.trim() === "" ||
      t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
      (t.description ?? "").toLowerCase().includes(templateSearch.toLowerCase());
    const matchesCategory =
      templateCategoryFilter === "all" || t.category === templateCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const templateCategories = Array.from(new Set(templates.map((t) => t.category)));

  // ── Choose mode ────────────────────────────────────────────────────────────

  if (mode === "choose") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <button
          onClick={() => navigate("/builder")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to documents
        </button>

        <h1 className="text-2xl font-bold text-foreground mb-1">New document</h1>
        <p className="text-sm text-muted-foreground mb-8">Choose how to start your document.</p>

        <div className="grid sm:grid-cols-2 gap-4">
          <button
            onClick={() => setMode("blank")}
            className="group p-6 rounded-2xl border border-border hover:border-primary/50 bg-card hover:bg-primary/3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <FileText className="w-8 h-8 text-muted-foreground group-hover:text-primary mb-3 transition-colors" />
            <h3 className="font-semibold text-foreground mb-1">Blank document</h3>
            <p className="text-sm text-muted-foreground">Start from scratch with your own structure.</p>
          </button>

          <button
            onClick={() => setMode("template")}
            className="group p-6 rounded-2xl border border-border hover:border-primary/50 bg-card hover:bg-primary/3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <LayoutTemplate className="w-8 h-8 text-muted-foreground group-hover:text-primary mb-3 transition-colors" />
            <h3 className="font-semibold text-foreground mb-1">From template</h3>
            <p className="text-sm text-muted-foreground">Start from a pre-built structure for common document types.</p>
          </button>
        </div>
      </div>
    );
  }

  // ── Blank flow ─────────────────────────────────────────────────────────────

  if (mode === "blank") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <button
          onClick={() => { setMode("choose"); setSubmitError(null); }}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <h1 className="text-2xl font-bold text-foreground mb-8">New blank document</h1>

        <form
          className="space-y-6"
          onSubmit={(e) => { e.preventDefault(); handleCreateBlank(); }}
        >
          <div>
            <label htmlFor="blank-title" className="text-sm font-medium text-foreground block mb-2">
              Document title <span className="text-destructive">*</span>
            </label>
            <input
              ref={titleRef}
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
              <AlertCircle className="w-4 h-4 shrink-0" />
              {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={!canCreateBlank || submitting}
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Create document
          </button>
        </form>
      </div>
    );
  }

  // ── Questions flow ─────────────────────────────────────────────────────────

  if (mode === "questions" && selectedTemplate) {
    const questions = getQuestionsForCategory(selectedTemplate.category);
    const requiredUnanswered = questions
      .filter((q) => q.required)
      .some((q) => !(answers[q.id] ?? "").trim());

    const canSubmit = canCreateFromQuestions && !requiredUnanswered;

    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <button
          onClick={() => { setMode("template"); setSubmitError(null); }}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to templates
        </button>

        {/* Template badge */}
        <div className="flex items-center gap-2 mb-5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/8 border border-primary/20">
            <LayoutTemplate className="w-3 h-3 text-primary" />
            <span className="text-xs font-medium text-primary">{selectedTemplate.name}</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-1">Personalize your document</h1>
        <p className="text-sm text-muted-foreground mb-8">
          These details will be added to a Document Information header section. You can edit everything in the workspace.
        </p>

        <div className="space-y-5">
          {/* Document title */}
          <div>
            <label htmlFor="q-title" className="text-sm font-medium text-foreground block mb-1.5">
              Document title <span className="text-destructive">*</span>
            </label>
            <input
              ref={questionsTitleRef}
              id="q-title"
              type="text"
              value={questionsTitle}
              onChange={(e) => setQuestionsTitle(e.target.value)}
              placeholder={`e.g. ${selectedTemplate.name}`}
              maxLength={200}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary transition-colors text-sm"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              Category <span className="text-destructive">*</span>
            </label>
            <CategoryPicker selected={questionsCategory} onSelect={setQuestionsCategory} />
          </div>

          {/* Divider */}
          <div className="border-t border-border/50 pt-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
              Document details
            </p>

            <div className="space-y-4">
              {questions.map((q) => (
                <div key={q.id}>
                  <label
                    htmlFor={`q-${q.id}`}
                    className="text-sm font-medium text-foreground block mb-1.5"
                  >
                    {q.label}
                    {q.required && <span className="text-destructive ml-1">*</span>}
                    {q.hint && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">{q.hint}</span>
                    )}
                  </label>
                  <input
                    id={`q-${q.id}`}
                    type={q.type}
                    value={answers[q.id] ?? ""}
                    onChange={(e) =>
                      setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                    }
                    placeholder={q.placeholder}
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary transition-colors text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          {submitError && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {submitError}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              disabled={!canCreateFromQuestions || submitting}
              onClick={() => handleCreateFromTemplate(true)}
              className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Skip, create blank
            </button>
            <button
              type="button"
              disabled={!canSubmit || submitting}
              onClick={() => handleCreateFromTemplate(false)}
              className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Create document
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Template browser ───────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <button
        onClick={() => { setMode("choose"); setSelectedTemplate(null); setSubmitError(null); setTemplatesError(false); }}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h1 className="text-2xl font-bold text-foreground mb-2">Choose a template</h1>
      <p className="text-sm text-muted-foreground mb-6">Select a starting point for your document.</p>

      {/* Loading */}
      {templatesLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error state */}
      {!templatesLoading && templatesError && (
        <div className="text-center py-12">
          <AlertCircle className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-4">Couldn't load templates. Please try again.</p>
          <button
            onClick={() => { setTemplatesError(false); setTemplates([]); }}
            className="text-sm text-primary hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Template browser */}
      {!templatesLoading && !templatesError && templates.length > 0 && (
        <div className="space-y-5">
          {/* Search + filter */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50 pointer-events-none" />
              <input
                type="text"
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                placeholder="Search templates…"
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary transition-colors"
              />
            </div>
            <select
              value={templateCategoryFilter}
              onChange={(e) => setTemplateCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground outline-none focus:border-primary transition-colors"
            >
              <option value="all">All categories</option>
              {templateCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat] ?? cat}
                </option>
              ))}
            </select>
          </div>

          {/* Template grid */}
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No templates match your search.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-2">
              {filteredTemplates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelectTemplate(selectedTemplate?.id === t.id ? null! : t)}
                  className={`p-4 rounded-xl border text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    selectedTemplate?.id === t.id
                      ? "border-primary bg-primary/8"
                      : "border-border bg-card hover:border-foreground/30 hover:bg-secondary/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground/70 mt-0.5">
                        {CATEGORY_LABELS[t.category] ?? t.category}
                      </p>
                      {t.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</p>
                      )}
                    </div>
                    {selectedTemplate?.id === t.id ? (
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Continue CTA */}
          {selectedTemplate && (
            <div className="border-t border-border pt-5 flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{selectedTemplate.name}</span> selected
              </p>
              <button
                onClick={handleUseTemplate}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors shrink-0"
              >
                Use this template
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
