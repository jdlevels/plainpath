import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, FileText, LayoutTemplate, Loader2, CheckCircle2 } from "lucide-react";
import { builderApi } from "@/lib/builderApi";
import type { BuilderTemplate } from "@/lib/builderTypes";
import { BUILDER_CATEGORIES, CATEGORY_LABELS } from "@/lib/builderConfig";
import type { BuilderCategory } from "@/lib/builderConfig";

type Mode = "choose" | "blank" | "template";

const EMPTY_CONTENT = { sections: [] };

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
  const [mode, setMode] = useState<Mode>("choose");

  // Blank flow
  const [blankCategory, setBlankCategory] = useState<BuilderCategory | "">("");
  const [blankTitle, setBlankTitle] = useState("");

  // Template flow
  const [templates, setTemplates] = useState<BuilderTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<BuilderTemplate | null>(null);
  const [templateTitle, setTemplateTitle] = useState("");
  const [templateCategory, setTemplateCategory] = useState<BuilderCategory | "">("");

  // Submitting
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === "template" && templates.length === 0) {
      setTemplatesLoading(true);
      builderApi.listTemplates().then((t) => {
        setTemplates(t);
        setTemplatesLoading(false);
      }).catch(() => setTemplatesLoading(false));
    }
  }, [mode]);

  useEffect(() => {
    if (selectedTemplate) {
      setTemplateTitle(selectedTemplate.name);
      setTemplateCategory(selectedTemplate.category as BuilderCategory);
    }
  }, [selectedTemplate]);

  async function handleCreateBlank() {
    if (!blankTitle.trim() || !blankCategory) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const doc = await builderApi.createDocument({
        title: blankTitle.trim(),
        category: blankCategory,
        source: "blank",
        content: EMPTY_CONTENT,
      });
      navigate(`/builder/${doc.id}`);
    } catch {
      setSubmitError("Failed to create document. Please try again.");
      setSubmitting(false);
    }
  }

  async function handleCreateFromTemplate() {
    if (!selectedTemplate || !templateTitle.trim() || !templateCategory) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const doc = await builderApi.createDocument({
        title: templateTitle.trim(),
        category: templateCategory,
        source: "template",
        templateId: selectedTemplate.id,
        content: selectedTemplate.content,
      });
      navigate(`/builder/${doc.id}`);
    } catch {
      setSubmitError("Failed to create document. Please try again.");
      setSubmitting(false);
    }
  }

  // ── Choose mode ───────────────────────────────────────────────────────────

  if (mode === "choose") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <button
          onClick={() => navigate("/builder")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <h1 className="text-2xl font-bold text-foreground mb-2">New document</h1>
        <p className="text-muted-foreground mb-8">Choose how you want to start.</p>

        <div className="grid sm:grid-cols-2 gap-4">
          <button
            onClick={() => setMode("blank")}
            className="group p-6 rounded-2xl border border-border hover:border-primary/50 bg-card hover:bg-primary/3 text-left transition-all"
          >
            <FileText className="w-8 h-8 text-muted-foreground group-hover:text-primary mb-3 transition-colors" />
            <h3 className="font-semibold text-foreground mb-1">Blank document</h3>
            <p className="text-sm text-muted-foreground">Start from scratch with your own structure.</p>
          </button>

          <button
            onClick={() => setMode("template")}
            className="group p-6 rounded-2xl border border-border hover:border-primary/50 bg-card hover:bg-primary/3 text-left transition-all"
          >
            <LayoutTemplate className="w-8 h-8 text-muted-foreground group-hover:text-primary mb-3 transition-colors" />
            <h3 className="font-semibold text-foreground mb-1">From template</h3>
            <p className="text-sm text-muted-foreground">Start from a pre-built structure for common document types.</p>
          </button>
        </div>
      </div>
    );
  }

  // ── Blank flow ────────────────────────────────────────────────────────────

  if (mode === "blank") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <button
          onClick={() => setMode("choose")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <h1 className="text-2xl font-bold text-foreground mb-8">New blank document</h1>

        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Document title</label>
            <input
              type="text"
              value={blankTitle}
              onChange={(e) => setBlankTitle(e.target.value)}
              placeholder="e.g. Engineering Onboarding Checklist"
              maxLength={200}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary transition-colors text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Category</label>
            <CategoryPicker selected={blankCategory} onSelect={setBlankCategory} />
          </div>

          {submitError && (
            <p className="text-sm text-destructive">{submitError}</p>
          )}

          <button
            onClick={handleCreateBlank}
            disabled={!blankTitle.trim() || !blankCategory || submitting}
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Create document
          </button>
        </div>
      </div>
    );
  }

  // ── Template flow ─────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <button
        onClick={() => { setMode("choose"); setSelectedTemplate(null); }}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h1 className="text-2xl font-bold text-foreground mb-8">Choose a template</h1>

      {templatesLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!templatesLoading && templates.length > 0 && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-2">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  selectedTemplate?.id === t.id
                    ? "border-primary bg-primary/8"
                    : "border-border bg-card hover:border-foreground/30"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-foreground text-sm">{t.name}</p>
                    {t.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.description}</p>
                    )}
                  </div>
                  {selectedTemplate?.id === t.id && (
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {selectedTemplate && (
            <div className="border-t border-border pt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Document title</label>
                <input
                  type="text"
                  value={templateTitle}
                  onChange={(e) => setTemplateTitle(e.target.value)}
                  maxLength={200}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary transition-colors text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Category</label>
                <CategoryPicker
                  selected={templateCategory}
                  onSelect={setTemplateCategory}
                />
              </div>

              {submitError && (
                <p className="text-sm text-destructive">{submitError}</p>
              )}

              <button
                onClick={handleCreateFromTemplate}
                disabled={!templateTitle.trim() || !templateCategory || submitting}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Create from template
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
