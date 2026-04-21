import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Upload, X, FileText, AlertTriangle, ListChecks,
  CheckCircle2, HelpCircle, Sparkles, LogIn, Loader2, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getApiBaseUrl } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DemoStatus {
  demoGuestPresent: boolean;
  completedUses: number;
  remainingUses: number;
  isExhausted: boolean;
}

interface DemoResult {
  success: true;
  fileName: string;
  pageCount: number;
  documentType: string;
  summary: string;
  keyRisks: string[];
  nextSteps: string[];
  missingItems: string[];
  completedUses: number;
  remainingUses: number;
  isExhausted: boolean;
}

type AnalyzeState =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "result"; data: DemoResult }
  | { phase: "error"; message: string };

// ─── Limits ──────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE_MB = 10;
const MAX_PAGES = 10;
const ACCEPT_TYPES = ["application/pdf"];

// ─── Usage badge ──────────────────────────────────────────────────────────────

function UsageBadge({ remaining, isExhausted }: { remaining: number; isExhausted: boolean }) {
  if (isExhausted) {
    return (
      <Badge variant="destructive" className="text-xs px-2.5 py-1">
        Trial used up
      </Badge>
    );
  }
  if (remaining === 1) {
    return (
      <Badge className="text-xs px-2.5 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
        1 free try left
      </Badge>
    );
  }
  return (
    <Badge className="text-xs px-2.5 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
      {remaining} free {remaining === 1 ? "try" : "tries"} left
    </Badge>
  );
}

// ─── Result panel ─────────────────────────────────────────────────────────────

function ResultPanel({ data }: { data: DemoResult }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* Doc type + summary */}
      <Card className="p-5 border-primary/20 bg-primary/5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2 shrink-0 mt-0.5">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary mb-1">
              {data.documentType}
            </p>
            <p className="text-sm text-foreground leading-relaxed">{data.summary}</p>
            <p className="text-xs text-muted-foreground mt-1.5">
              {data.fileName} · {data.pageCount} {data.pageCount === 1 ? "page" : "pages"}
            </p>
          </div>
        </div>
      </Card>

      {/* Key risks */}
      {data.keyRisks.length > 0 && (
        <Card className="p-5 border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span className="text-sm font-semibold text-red-800 dark:text-red-300">Key risks &amp; concerns</span>
          </div>
          <ul className="space-y-2">
            {data.keyRisks.map((risk, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-red-900 dark:text-red-200">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                {risk}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Next steps */}
      {data.nextSteps.length > 0 && (
        <Card className="p-5 border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
          <div className="flex items-center gap-2 mb-3">
            <ListChecks className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">Recommended next steps</span>
          </div>
          <ol className="space-y-2">
            {data.nextSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-blue-900 dark:text-blue-200">
                <span className="font-semibold shrink-0 w-5 text-right">{i + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
        </Card>
      )}

      {/* Missing items */}
      {data.missingItems.length > 0 && (
        <Card className="p-5 border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20">
          <div className="flex items-center gap-2 mb-3">
            <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">Items to ask about</span>
          </div>
          <ul className="space-y-2">
            {data.missingItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-amber-900 dark:text-amber-200">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Upgrade CTA */}
      <Card className="p-5 border-border bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-slate-800/50">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground mb-1">
              {data.isExhausted
                ? "That was your last free trial analysis."
                : `You have ${data.remainingUses} free ${data.remainingUses === 1 ? "analysis" : "analyses"} remaining.`}
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              The full app unlocks unlimited analyses, saved history, export, and all 6 document tools.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" asChild>
                <a href="/sign-up">
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Create free account
                </a>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href="/sign-in">
                  <LogIn className="w-3.5 h-3.5 mr-1.5" />
                  Sign in
                </a>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DemoAnalyze() {
  const [, navigate] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<DemoStatus | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [analyzeState, setAnalyzeState] = useState<AnalyzeState>({ phase: "idle" });

  // Load status on mount
  useEffect(() => {
    fetch(`${getApiBaseUrl()}/api/demo/status`, { credentials: "include" })
      .then((r) => r.json())
      .then((data: DemoStatus) => setStatus(data))
      .catch(() =>
        setStatus({ demoGuestPresent: false, completedUses: 0, remainingUses: 2, isExhausted: false }),
      );
  }, []);

  const remaining = status?.remainingUses ?? 2;
  const isExhausted = status?.isExhausted ?? false;

  // File selection
  function handleFileSelect(file: File) {
    setValidationError(null);
    if (!ACCEPT_TYPES.includes(file.type)) {
      setValidationError("Only PDF files are accepted for the demo.");
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setValidationError(`File must be ${MAX_FILE_SIZE_MB} MB or smaller.`);
      return;
    }
    setSelectedFile(file);
    setAnalyzeState({ phase: "idle" });
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }

  function removeFile() {
    setSelectedFile(null);
    setValidationError(null);
    setAnalyzeState({ phase: "idle" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // Run analysis
  async function handleAnalyze() {
    if (!selectedFile || analyzeState.phase === "loading") return;

    setAnalyzeState({ phase: "loading" });

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/demo/analyze`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403 && data.error === "quota_exhausted") {
          setStatus((prev) => prev ? { ...prev, remainingUses: 0, isExhausted: true } : null);
          setAnalyzeState({
            phase: "error",
            message: "You have used all 2 free demo analyses. Create a free account to continue.",
          });
          return;
        }
        setAnalyzeState({
          phase: "error",
          message: data.message ?? "Analysis failed. Please try again.",
        });
        return;
      }

      // Update remaining uses from server response
      setStatus((prev) =>
        prev
          ? { ...prev, remainingUses: data.remainingUses, completedUses: data.completedUses, isExhausted: data.isExhausted }
          : null,
      );
      setAnalyzeState({ phase: "result", data });
    } catch {
      setAnalyzeState({ phase: "error", message: "Network error. Please check your connection and try again." });
    }
  }

  const canAnalyze = !!selectedFile && !isExhausted && analyzeState.phase !== "loading";

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 px-4 py-8 md:py-12">
      <div className="max-w-2xl mx-auto">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-7">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/demo")}
            className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to demo
          </Button>

          <div className="flex items-center gap-2">
            {status ? (
              <UsageBadge remaining={remaining} isExhausted={isExhausted} />
            ) : (
              <div className="h-6 w-24 rounded-full bg-muted animate-pulse" />
            )}
          </div>
        </div>

        {/* Page heading */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-7"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="rounded-lg bg-blue-100 dark:bg-blue-950 p-2">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Analyze a Document</h1>
            <Badge className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-300 ml-1">
              <Zap className="w-2.5 h-2.5 mr-1" />
              Free demo
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Upload a PDF (up to {MAX_FILE_SIZE_MB} MB, {MAX_PAGES} pages). Get a plain-English breakdown of what it says, what to watch for, and what to do next.
          </p>
        </motion.div>

        {/* Exhausted state */}
        {isExhausted && analyzeState.phase !== "result" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-6 text-center mb-6"
          >
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
            <p className="font-semibold text-amber-900 dark:text-amber-200 mb-1">
              Free trial limit reached
            </p>
            <p className="text-sm text-amber-800 dark:text-amber-300 mb-4">
              You've used your 2 free analyses. Create a free account to keep using PlainPath — no credit card required.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Button asChild size="sm">
                <a href="/sign-up">
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Create free account
                </a>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href="/sign-in">Sign in</a>
              </Button>
            </div>
          </motion.div>
        )}

        {/* Upload area — show when not exhausted or no result yet */}
        {(!isExhausted || analyzeState.phase === "idle") && analyzeState.phase !== "result" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-5"
          >
            {!selectedFile ? (
              /* Drop zone */
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => !isExhausted && fileInputRef.current?.click()}
                className={[
                  "rounded-xl border-2 border-dashed transition-all duration-200 p-10 text-center",
                  isExhausted
                    ? "border-border bg-muted/20 cursor-not-allowed opacity-50"
                    : "border-blue-300 dark:border-blue-700 bg-blue-50/30 dark:bg-blue-950/10 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-400 dark:hover:border-blue-600 cursor-pointer",
                ].join(" ")}
              >
                <Upload className="w-8 h-8 text-blue-400 dark:text-blue-500 mx-auto mb-3" />
                <p className="font-medium text-foreground text-sm mb-1">
                  {isExhausted ? "Free trial exhausted" : "Drop your PDF here, or click to browse"}
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF only · max {MAX_FILE_SIZE_MB} MB · max {MAX_PAGES} pages
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileSelect(f);
                  }}
                />
              </div>
            ) : (
              /* Selected file card */
              <Card className="p-4 flex items-center gap-3 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
                <div className="rounded-lg bg-blue-100 dark:bg-blue-900 p-2 shrink-0">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                </div>
                <button
                  onClick={removeFile}
                  className="rounded-full p-1 hover:bg-muted transition-colors shrink-0"
                  aria-label="Remove file"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </Card>
            )}

            {/* Validation error */}
            <AnimatePresence>
              {validationError && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-2 text-sm text-destructive flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  {validationError}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Analyze button */}
            <div className="mt-4">
              <Button
                onClick={handleAnalyze}
                disabled={!canAnalyze}
                className="w-full h-11 text-sm font-semibold gap-2"
              >
                {analyzeState.phase === "loading" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Analyze document
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Error state */}
        <AnimatePresence>
          {analyzeState.phase === "error" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4"
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-sm text-destructive">{analyzeState.message}</p>
              </div>
              {!isExhausted && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => setAnalyzeState({ phase: "idle" })}
                >
                  Try again
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result */}
        <AnimatePresence>
          {analyzeState.phase === "result" && (
            <ResultPanel data={analyzeState.data} />
          )}
        </AnimatePresence>

        {/* Run another / sign up strip after result */}
        {analyzeState.phase === "result" && !analyzeState.data.isExhausted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-5 text-center"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                removeFile();
                setAnalyzeState({ phase: "idle" });
              }}
            >
              Analyze another document
            </Button>
          </motion.div>
        )}

      </div>
    </div>
  );
}
