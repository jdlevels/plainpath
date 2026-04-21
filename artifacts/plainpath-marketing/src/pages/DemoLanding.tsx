import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  FileText, ShieldAlert, FileSignature, Scale, EyeOff,
  GitCompare, Lock, ArrowRight, Sparkles, LogIn, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DemoStatus {
  demoGuestPresent: boolean;
  completedUses: number;
  remainingUses: number;
  isExhausted: boolean;
}

// ─── Tool definitions ─────────────────────────────────────────────────────────

const DEMO_TOOLS = [
  {
    key: "analyze",
    label: "Analyze a Document",
    description: "Upload a PDF and get a plain-English breakdown — risks, obligations, next steps.",
    icon: FileText,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-800",
    href: "/demo/analyze",
    enabled: true,
  },
  {
    key: "trust-check",
    label: "Document Trust Check",
    description: "Verify authenticity signals and flag suspicious document patterns.",
    icon: ShieldAlert,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/40",
    border: "border-red-200 dark:border-red-800",
    href: null,
    enabled: false,
  },
  {
    key: "compare",
    label: "Compare Versions",
    description: "See exactly what changed between two document versions, word by word.",
    icon: GitCompare,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/40",
    border: "border-violet-200 dark:border-violet-800",
    href: null,
    enabled: false,
  },
  {
    key: "contract",
    label: "Contract Review",
    description: "AI-powered review of contract terms, red flags, and negotiation points.",
    icon: Scale,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800",
    href: null,
    enabled: false,
  },
  {
    key: "redact",
    label: "Redact Sensitive Info",
    description: "Automatically find and redact personal or sensitive information.",
    icon: EyeOff,
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-50 dark:bg-slate-950/40",
    border: "border-slate-200 dark:border-slate-800",
    href: null,
    enabled: false,
  },
  {
    key: "sign",
    label: "Digital Signature",
    description: "Request and collect legally binding electronic signatures.",
    icon: FileSignature,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800",
    href: null,
    enabled: false,
  },
];

// ─── Usage badge ──────────────────────────────────────────────────────────────

function UsageBadge({ remaining, isExhausted }: { remaining: number; isExhausted: boolean }) {
  if (isExhausted) {
    return (
      <Badge variant="destructive" className="text-xs px-2.5 py-1">
        Free trial used up
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
      {remaining} free {remaining === 1 ? "try" : "tries"} included
    </Badge>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DemoLanding() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<DemoStatus | null>(null);

  useEffect(() => {
    fetch("/api/demo/status", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setStatus(data))
      .catch(() =>
        setStatus({ demoGuestPresent: false, completedUses: 0, remainingUses: 2, isExhausted: false }),
      );
  }, []);

  const remaining = status?.remainingUses ?? 2;
  const isExhausted = status?.isExhausted ?? false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 px-4 py-10 md:py-16">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-10"
        >
          {/* Logo back link */}
          <div className="flex justify-center mb-6">
            <a href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Back to PlainPath
            </a>
          </div>

          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Free Trial — no account needed
          </div>
          <h1
            className="text-3xl md:text-4xl font-bold text-foreground mb-3"
            style={{ fontFamily: "var(--font-display, inherit)" }}
          >
            Try PlainPath free
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Upload a real document and see what PlainPath finds — in plain English.
            No sign-up required.
          </p>

          {/* Remaining uses strip */}
          <div className="mt-5 flex items-center justify-center gap-3">
            {status ? (
              <UsageBadge remaining={remaining} isExhausted={isExhausted} />
            ) : (
              <div className="h-6 w-32 rounded-full bg-muted animate-pulse" />
            )}
            <span className="text-xs text-muted-foreground">
              Includes 2 free analyses — results visible instantly.
            </span>
          </div>
        </motion.div>

        {/* Exhausted banner */}
        {isExhausted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-5 text-center"
          >
            <p className="font-semibold text-amber-900 dark:text-amber-200 mb-1">
              You've used your 2 free trial analyses.
            </p>
            <p className="text-sm text-amber-800 dark:text-amber-300 mb-4">
              Create a free account to keep going — no credit card required.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Button asChild size="sm">
                <a href="/app/sign-up">Create free account</a>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href="/app/sign-in">Sign in</a>
              </Button>
            </div>
          </motion.div>
        )}

        {/* Tool cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10"
        >
          {DEMO_TOOLS.map((tool) => {
            const Icon = tool.icon;
            const canUse = tool.enabled && !isExhausted;

            return (
              <div
                key={tool.key}
                onClick={() => canUse && tool.href && navigate(tool.href)}
                className={[
                  "relative rounded-xl border p-5 transition-all duration-200",
                  tool.enabled
                    ? canUse
                      ? `${tool.border} ${tool.bg} hover:shadow-md cursor-pointer hover:scale-[1.01]`
                      : `${tool.border} ${tool.bg} opacity-60 cursor-not-allowed`
                    : "border-border bg-muted/30 opacity-50 cursor-not-allowed",
                ].join(" ")}
              >
                {/* Enabled badge */}
                {tool.enabled && (
                  <span className="absolute top-3 right-3">
                    {canUse ? (
                      <Badge className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-300">
                        <Zap className="w-2.5 h-2.5 mr-1" />
                        Try free
                      </Badge>
                    ) : (
                      <Badge className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-300">
                        Trial used
                      </Badge>
                    )}
                  </span>
                )}

                {/* Locked badge */}
                {!tool.enabled && (
                  <span className="absolute top-3 right-3">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 text-muted-foreground">
                      <Lock className="w-2.5 h-2.5 mr-1" />
                      Full app
                    </Badge>
                  </span>
                )}

                <div className={`inline-flex rounded-lg p-2.5 mb-3 ${tool.bg}`}>
                  <Icon className={`w-5 h-5 ${tool.color}`} />
                </div>
                <h3 className="font-semibold text-foreground text-sm mb-1">{tool.label}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{tool.description}</p>

                {tool.enabled && canUse && (
                  <div className={`mt-3 flex items-center gap-1 text-xs font-medium ${tool.color}`}>
                    Try it now <ArrowRight className="w-3 h-3" />
                  </div>
                )}
              </div>
            );
          })}
        </motion.div>

        {/* Sign-in CTA strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="rounded-xl border border-border bg-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div>
            <p className="font-semibold text-foreground text-sm">Want the full experience?</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Unlimited analyses, history, export, all 6 tools — free to start.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button asChild size="sm">
              <a href="/app/sign-up">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Create account
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href="/app/sign-in">
                <LogIn className="w-3.5 h-3.5 mr-1.5" />
                Sign in
              </a>
            </Button>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
