import { useState } from "react";
import { motion } from "framer-motion";
import {
  MessageCircle, FileText, ChevronRight, CheckCircle2, BookOpen,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DemoShell } from "@/demo/DemoShell";

const DOCUMENT = {
  fileName: "Residential_Lease_Unit4B.pdf",
  pages: 12,
  wordCount: 2140,
  type: "Residential Lease Agreement",
  excerpt: [
    'This Residential Lease Agreement ("Agreement") is entered into as of February 1, 2025, between Park Avenue Properties LLC ("Landlord") and Jordan M. Brooks ("Tenant").',
    '1. TERM. The lease term begins February 1, 2025 and ends January 31, 2026 ("Expiration Date").',
    "2. RENT. Monthly rent is $2,150.00 due on the 1st of each month. A late fee of $125 applies after the 5-day grace period.",
    "3. SECURITY DEPOSIT. Tenant shall pay a security deposit of $2,150.00 prior to move-in. Deposit shall be returned within 21 days of move-out with itemized deductions.",
    "4. ENTRY. Landlord shall provide a minimum of 12 hours advance written notice before entering the premises except in case of emergency.",
    "5. EARLY TERMINATION. Tenant may terminate this Agreement early by providing 60 days written notice and paying a penalty equal to two months' rent ($4,300.00).",
    "6. AUTO-RENEWAL. If Tenant fails to provide 60 days written notice before the Expiration Date, this Agreement shall automatically renew on a month-to-month basis at the then-current market rate.",
    "7. REPAIRS. Tenant is responsible for all repairs under $150. Landlord is responsible for all structural repairs and appliance replacements.",
  ],
};

const QA = [
  {
    id: "q1",
    question: "What happens if I want to leave before the lease ends?",
    answer:
      "You can end the lease early, but it will cost you. You need to give 60 days written notice AND pay a penalty of two months' rent — that's $4,300. This is found in Section 5 of your lease.",
    source: "§5 Early Termination · Page 3",
    excerptIndex: 5,
    color: "indigo",
  },
  {
    id: "q2",
    question: "How much notice does my landlord need to give before entering my unit?",
    answer:
      "Your lease states your landlord must give at least 12 hours advance written notice before entering — except in an emergency. Note: Texas state law actually requires 24 hours minimum, so your landlord's 12-hour requirement may be below the legal standard.",
    source: "§4 Entry · Page 2",
    excerptIndex: 4,
    color: "amber",
  },
  {
    id: "q3",
    question: "What happens if I don't renew or give notice before the lease ends?",
    answer:
      "If you don't give 60 days written notice before January 31, 2026, your lease automatically converts to a month-to-month arrangement at the then-current market rate — which could be higher than your current $2,150/month rent.",
    source: "§6 Auto-Renewal · Page 4",
    excerptIndex: 6,
    color: "red",
  },
];

type ColorKey = "indigo" | "amber" | "red";

const colorMap: Record<ColorKey, {
  badge: string; card: string; border: string; dot: string; source: string;
}> = {
  indigo: {
    badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-300",
    card: "bg-indigo-50/60 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800",
    border: "border-l-indigo-500 dark:border-l-indigo-400",
    dot: "bg-indigo-500",
    source: "text-indigo-600 dark:text-indigo-400",
  },
  amber: {
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-300",
    card: "bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800",
    border: "border-l-amber-500 dark:border-l-amber-400",
    dot: "bg-amber-500",
    source: "text-amber-600 dark:text-amber-400",
  },
  red: {
    badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-300",
    card: "bg-red-50/60 dark:bg-red-950/20 border-red-200 dark:border-red-800",
    border: "border-l-red-500 dark:border-l-red-400",
    dot: "bg-red-500",
    source: "text-red-600 dark:text-red-400",
  },
};

export default function DemoAskDocument() {
  const [activeQ, setActiveQ] = useState<string>("q1");
  const active = QA.find((q) => q.id === activeQ) ?? QA[0];
  const c = colorMap[active.color as ColorKey];

  return (
    <DemoShell
      toolName="Ask This Document"
      subtitle="Upload any document and ask plain-English questions. PlainPath finds the answer directly from the text and shows you exactly where."
      scenarioLabel="Residential lease · Unit 4B, Austin TX · 12 pages · 3 sample questions"
    >
      {/* Summary banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center gap-3 mb-6 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/15"
      >
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <span className="text-sm font-semibold text-indigo-800 dark:text-indigo-200">{DOCUMENT.fileName}</span>
        </div>
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <Badge className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-300">
            {DOCUMENT.pages} pages
          </Badge>
          <Badge className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-300">
            {DOCUMENT.wordCount.toLocaleString()} words
          </Badge>
          <Badge className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-300">
            <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
            Searching document text…
          </Badge>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left: Document excerpt + question list */}
        <div className="lg:col-span-2 space-y-4">
          {/* Document excerpt */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="rounded-2xl border border-border bg-card p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">Document excerpt</span>
              <Badge variant="outline" className="text-[10px] ml-auto">Fictional sample</Badge>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {DOCUMENT.excerpt.map((line, i) => (
                <p
                  key={i}
                  className={`text-[11px] leading-relaxed px-2 py-1 rounded transition-colors ${
                    i === active.excerptIndex
                      ? "bg-indigo-100/80 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-200 font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  {line}
                </p>
              ))}
            </div>
          </motion.div>

          {/* Question list */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-2xl border border-border bg-card p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">Sample questions</span>
            </div>
            <div className="space-y-2">
              {QA.map((q) => {
                const qc = colorMap[q.color as ColorKey];
                const isActive = activeQ === q.id;
                return (
                  <button
                    key={q.id}
                    onClick={() => setActiveQ(q.id)}
                    className={`w-full text-left rounded-xl border px-3 py-2.5 transition-all text-xs leading-snug flex items-center justify-between gap-2 ${
                      isActive
                        ? `${qc.card} ${qc.border} border-l-4 font-medium text-foreground`
                        : "border-border hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="flex-1">{q.question}</span>
                    <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${isActive ? "rotate-90 opacity-100" : "opacity-40"}`} />
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Right: Answer panel */}
        <div className="lg:col-span-3">
          <motion.div
            key={activeQ}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border ${c.card} p-5 h-full`}
          >
            {/* Question */}
            <div className="flex items-start gap-3 mb-4">
              <div className={`w-2 h-2 rounded-full ${c.dot} mt-1.5 shrink-0`} />
              <p className="text-sm font-semibold text-foreground leading-snug">{active.question}</p>
            </div>

            {/* Answer */}
            <div className="rounded-xl bg-background border border-border/60 p-4 mb-4">
              <p className="text-sm text-foreground leading-relaxed">{active.answer}</p>
            </div>

            {/* Source reference */}
            <div className="flex items-center gap-2 mb-5">
              <BookOpen className={`w-3.5 h-3.5 ${c.source} shrink-0`} />
              <span className={`text-xs font-semibold ${c.source}`}>Source: {active.source}</span>
              <Badge className={`text-[10px] ml-auto ${c.badge}`}>From document text</Badge>
            </div>

            {/* Highlighted excerpt */}
            <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Referenced passage
              </p>
              <p className={`text-[11px] leading-relaxed italic border-l-2 ${c.border.replace("border-l-", "border-")} pl-3 text-foreground`}>
                "{DOCUMENT.excerpt[active.excerptIndex]}"
              </p>
            </div>

            {/* Navigation dots */}
            <div className="flex items-center justify-center gap-2 mt-5">
              {QA.map((q) => (
                <button
                  key={q.id}
                  onClick={() => setActiveQ(q.id)}
                  className={`rounded-full transition-all ${
                    activeQ === q.id ? "w-5 h-2 bg-primary" : "w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground/60 text-center mt-5">
        Fictional sample document for demo purposes. No real personal data used.
      </p>
    </DemoShell>
  );
}
