import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutTemplate, FileText, Download, CheckCircle2, Sparkles,
  List, Pencil, Palette, ChevronDown, ChevronRight,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DemoShell } from "@/demo/DemoShell";

const DOCUMENT = {
  title: "Employee Onboarding Guide",
  subtitle: "Meridian Coffee Roasters — New Hire Orientation",
  sections: [
    {
      id: "s1",
      heading: "1. Welcome & Company Overview",
      content:
        "Welcome to Meridian Coffee Roasters! We are a specialty coffee company founded in 2018, dedicated to direct-trade sourcing and sustainable roasting. This guide will walk you through everything you need to know in your first 30 days.",
      done: true,
    },
    {
      id: "s2",
      heading: "2. Your First Day",
      content:
        "Report to 412 Roast Row, Austin TX 78701 at 9:00 AM. Ask for your manager, Priya Nair. You will complete your I-9 paperwork, receive your equipment, and meet the team. Lunch is provided on Day 1.",
      done: true,
    },
    {
      id: "s3",
      heading: "3. Tools & Systems Access",
      content:
        "You will receive access to Slack, Google Workspace, and our internal inventory platform (BrewOps) by end of Day 1. IT setup is handled by Marcus in the Austin office. Email it@meridianroasters.com if there are delays.",
      done: true,
    },
    {
      id: "s4",
      heading: "4. Key Contacts & Team Structure",
      content:
        "Your direct manager is Priya Nair (Operations Lead). HR contact: Tamara Osei. Benefits enrollment: benefits@meridianroasters.com. Emergency line: (512) 555-0177.",
      done: true,
    },
    {
      id: "s5",
      heading: "5. HR Policies & Benefits",
      content:
        "Full-time employees receive health, dental, and vision coverage effective the 1st of the month following 30 days of employment. PTO accrues at 1.5 days per month. 401(k) enrollment opens after 90 days.",
      done: true,
    },
    {
      id: "s6",
      heading: "6. 30-Day Checklist",
      content:
        "Complete I-9 · Sign offer letter · Set up direct deposit · Schedule 1:1 with manager · Complete compliance training · Join company all-hands (every other Thursday).",
      done: false,
    },
    {
      id: "s7",
      heading: "7. Frequently Asked Questions",
      content: "Drafting…",
      done: false,
    },
  ],
};

type Tab = "outline" | "edit" | "style" | "export";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "outline", label: "Outline",  icon: List    },
  { id: "edit",    label: "Edit",     icon: Pencil  },
  { id: "style",   label: "Style",    icon: Palette },
  { id: "export",  label: "Export",   icon: Download },
];

function OutlinePanel() {
  const [open, setOpen] = useState<string | null>("s1");
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Document structure</p>
      {DOCUMENT.sections.map((s) => (
        <div key={s.id} className="rounded-xl border border-border/50 overflow-hidden">
          <button
            onClick={() => setOpen(open === s.id ? null : s.id)}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-muted/40 transition-colors"
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${s.done ? "bg-emerald-500" : "bg-amber-400"}`} />
            <span className="text-xs text-foreground flex-1 leading-snug">{s.heading}</span>
            {open === s.id ? <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" /> : <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />}
          </button>
          <AnimatePresence>
            {open === s.id && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <p className="px-3 pb-3 text-[11px] text-muted-foreground leading-relaxed">{s.content}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

function EditPanel() {
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">AI Guide suggestions</p>
      {[
        { label: "Expand Section 6", action: "Add specific deadline dates to the 30-Day Checklist.", color: "emerald" },
        { label: "Draft Section 7", action: "Generate 5 common new-hire FAQs based on the document content.", color: "indigo" },
        { label: "Add a glossary", action: "Define internal terms: BrewOps, all-hands, PTO accrual.", color: "violet" },
      ].map((s, i) => (
        <div key={i} className="rounded-xl border border-border/50 bg-muted/30 p-3 flex items-start gap-3">
          <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-foreground mb-0.5">{s.label}</p>
            <p className="text-[11px] text-muted-foreground leading-snug">{s.action}</p>
          </div>
        </div>
      ))}
      <div className="rounded-xl border border-border/50 bg-muted/20 px-3 py-2.5 flex items-center gap-2 text-xs text-muted-foreground/60 cursor-default">
        <Pencil className="w-3.5 h-3.5 shrink-0" />
        Click any block in the document to edit inline
      </div>
    </div>
  );
}

function StylePanel() {
  return (
    <div className="space-y-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Brand settings</p>
      {[
        { label: "Primary color", value: "#1a3c5e", preview: "#1a3c5e" },
        { label: "Accent color",  value: "#c8842a", preview: "#c8842a" },
      ].map(({ label, value, preview }) => (
        <div key={label} className="flex items-center justify-between gap-3">
          <span className="text-xs text-foreground">{label}</span>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded border border-border/50" style={{ background: preview }} />
            <span className="text-xs font-mono text-muted-foreground">{value}</span>
          </div>
        </div>
      ))}
      <div className="border-t border-border/40 pt-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground">Font</span>
          <span className="text-xs text-muted-foreground">Inter (system)</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground">Logo</span>
          <Badge variant="outline" className="text-[10px]">Not uploaded</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground">Header style</span>
          <span className="text-xs text-muted-foreground">Company banner</span>
        </div>
      </div>
    </div>
  );
}

function ExportPanel() {
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Export options</p>
      <div className="rounded-xl border border-emerald-200 dark:border-emerald-700 bg-emerald-50/60 dark:bg-emerald-950/20 p-3 flex items-center gap-3">
        <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <div className="flex-1">
          <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">Plain text (.txt)</p>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400">Available — downloads the full document as plain text.</p>
        </div>
        <Badge className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-300 shrink-0">Ready</Badge>
      </div>
      {[
        { format: "PDF (.pdf)", note: "Full styled document with brand colors and header." },
        { format: "Word (.docx)", note: "Editable document for Microsoft Word." },
      ].map(({ format, note }) => (
        <div key={format} className="rounded-xl border border-border/50 bg-muted/30 p-3 flex items-center gap-3 opacity-60">
          <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-foreground">{format}</p>
            <p className="text-[11px] text-muted-foreground">{note}</p>
          </div>
          <Badge variant="outline" className="text-[10px] shrink-0">Coming soon</Badge>
        </div>
      ))}
      <div className="flex items-start gap-2 mt-2 pt-2 border-t border-border/40">
        <AlertCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-px" />
        <p className="text-[11px] text-muted-foreground leading-snug">
          PDF and Word export are in development. Plain text export is available now in the full app.
        </p>
      </div>
    </div>
  );
}

export default function DemoBuilder() {
  const [activeTab, setActiveTab] = useState<Tab>("outline");
  const doneCount = DOCUMENT.sections.filter((s) => s.done).length;

  return (
    <DemoShell
      toolName="Document Builder"
      subtitle="Create SOPs, onboarding guides, policies, and internal docs from a guided question flow — with your brand applied and export-ready output."
      scenarioLabel="Employee Onboarding Guide · Meridian Coffee Roasters · 7 sections"
    >
      {/* Summary banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center gap-3 mb-6 p-4 rounded-2xl border border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-950/15"
      >
        <div className="flex items-center gap-2">
          <LayoutTemplate className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <span className="text-sm font-semibold text-teal-800 dark:text-teal-200">Employee_Onboarding_Guide.txt</span>
        </div>
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <Badge className="text-[10px] bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 border-teal-300">
            {DOCUMENT.sections.length} sections
          </Badge>
          <Badge className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-300">
            <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
            {doneCount}/{DOCUMENT.sections.length} drafted
          </Badge>
          <Badge className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300">
            .txt export ready
          </Badge>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left: Document preview */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="lg:col-span-3 rounded-2xl border border-border overflow-hidden"
        >
          {/* Doc header */}
          <div className="px-5 py-4 border-b border-border/60" style={{ background: "#1a3c5e" }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: "#c8842a" }}>
              Meridian Coffee Roasters
            </p>
            <h2 className="text-base font-bold text-white">{DOCUMENT.title}</h2>
            <p className="text-[11px] text-blue-200/80">{DOCUMENT.subtitle}</p>
          </div>

          {/* Sections */}
          <div className="divide-y divide-border/40 max-h-[480px] overflow-y-auto bg-card">
            {DOCUMENT.sections.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.07 + i * 0.04 }}
                className="px-5 py-3.5"
              >
                <div className="flex items-start gap-2.5 mb-1.5">
                  {s.done
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    : <div className="w-3.5 h-3.5 rounded-full border-2 border-amber-400 shrink-0 mt-0.5" />
                  }
                  <p className="text-xs font-semibold text-foreground leading-snug">{s.heading}</p>
                </div>
                <p className={`text-[11px] leading-relaxed pl-6 ${
                  s.content === "Drafting…"
                    ? "text-muted-foreground/50 italic"
                    : "text-muted-foreground"
                }`}>
                  {s.content}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="px-5 py-3 border-t border-border/40 bg-muted/20 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground/60">Fictional sample for demo purposes.</span>
            <span className="text-[10px] text-muted-foreground/60">Read-only preview</span>
          </div>
        </motion.div>

        {/* Right: AI Guide panel */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-2 flex flex-col rounded-2xl border border-border overflow-hidden"
        >
          {/* Tab bar */}
          <div className="flex border-b border-border/60 bg-muted/30">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 px-1 text-[10px] font-semibold transition-colors border-b-2 ${
                  activeTab === id
                    ? "border-primary text-primary bg-background"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 p-4 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
              >
                {activeTab === "outline" && <OutlinePanel />}
                {activeTab === "edit"    && <EditPanel />}
                {activeTab === "style"   && <StylePanel />}
                {activeTab === "export"  && <ExportPanel />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* AI Guide branding */}
          <div className="px-4 py-3 border-t border-border/40 bg-muted/20 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-[11px] text-muted-foreground">AI Guide — Demo mode · Read-only preview</span>
          </div>
        </motion.div>
      </div>

      <p className="text-xs text-muted-foreground/60 text-center mt-5">
        Fictional sample document for demo purposes. No real company or personal data used.
      </p>
    </DemoShell>
  );
}
