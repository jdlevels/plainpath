import { motion } from "framer-motion";
import { FileEdit, Type, Highlighter, EyeOff, Undo2, Download, MousePointer2, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { DemoShell } from "@/demo/DemoShell";

const ANNOTATIONS = [
  { type: "text", label: "Text added", color: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-300", icon: Type },
  { type: "highlight", label: "Section highlighted", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-300 border-yellow-300", icon: Highlighter },
  { type: "mask", label: "Area masked", color: "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300 border-slate-400", icon: EyeOff },
];

const TOOLS = [
  { icon: MousePointer2, label: "Select" },
  { icon: Type, label: "Text" },
  { icon: Highlighter, label: "Highlight" },
  { icon: EyeOff, label: "Mask" },
];

function PdfPageMockup({ page }: { page: 1 | 2 }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded border border-border shadow-md aspect-[8.5/11] w-full max-w-xs mx-auto relative overflow-hidden text-[10px] font-sans p-5">
      {page === 1 && (
        <>
          <p className="font-bold text-center text-sm mb-3 text-gray-800 dark:text-gray-200">Patient Consent Form</p>
          <p className="text-gray-500 dark:text-gray-400 mb-2">Riverdale Medical Group · Patient Services</p>

          <div className="space-y-2 mb-4">
            <div className="flex gap-2 items-baseline">
              <span className="text-gray-500 dark:text-gray-400 shrink-0">Patient Name:</span>
              {/* Text annotation overlay */}
              <span className="bg-blue-100 dark:bg-blue-900/50 border border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300 px-1.5 py-0.5 rounded text-[10px] font-medium">John Smith</span>
            </div>
            <div className="flex gap-2 items-baseline">
              <span className="text-gray-500 dark:text-gray-400 shrink-0">Date:</span>
              <span className="text-gray-800 dark:text-gray-200">April 18, 2025</span>
            </div>
            <div className="flex gap-2 items-baseline">
              <span className="text-gray-500 dark:text-gray-400 shrink-0">DOB:</span>
              {/* Mask annotation overlay */}
              <span className="bg-slate-700 dark:bg-slate-400 text-slate-700 dark:text-slate-400 px-2 rounded select-none">██/██/████</span>
            </div>
            <div className="flex gap-2 items-baseline">
              <span className="text-gray-500 dark:text-gray-400 shrink-0">Phone:</span>
              <span className="text-gray-800 dark:text-gray-200">(303) 555-0198</span>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mb-3">
            <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Consent for Treatment</p>
            {/* Highlight annotation overlay */}
            <span className="bg-yellow-200/80 dark:bg-yellow-500/20 text-gray-800 dark:text-gray-200 rounded px-0.5 leading-relaxed">
              I authorize Riverdale Medical Group and its designated staff to provide medical treatment deemed necessary for my care, including diagnostic procedures, medical examinations, and related services.
            </span>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
            <p className="text-gray-500 dark:text-gray-400 mb-1">Signature:</p>
            <div className="border-b border-gray-400 dark:border-gray-500 pb-0.5 w-32 mb-1" />
            <p className="text-gray-400 dark:text-gray-500">Date signed:</p>
          </div>
        </>
      )}
      {page === 2 && (
        <>
          <p className="font-bold text-center text-sm mb-3 text-gray-800 dark:text-gray-200">Insurance Information</p>
          <div className="space-y-2">
            <div className="flex gap-2"><span className="text-gray-500 dark:text-gray-400">Provider:</span><span className="text-gray-800 dark:text-gray-200">BlueCross BlueShield</span></div>
            <div className="flex gap-2"><span className="text-gray-500 dark:text-gray-400">Member ID:</span>
              <span className="bg-slate-700 dark:bg-slate-400 text-slate-700 dark:text-slate-400 px-2 rounded select-none">████-███████</span>
            </div>
            <div className="flex gap-2"><span className="text-gray-500 dark:text-gray-400">Group No.:</span><span className="text-gray-800 dark:text-gray-200">GRP-001234</span></div>
            <div className="flex gap-2"><span className="text-gray-500 dark:text-gray-400">Copay:</span><span className="text-gray-800 dark:text-gray-200">$30</span></div>
          </div>
          <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-3">
            <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Privacy Notice Acknowledgment</p>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed">I acknowledge receipt of the Notice of Privacy Practices and understand that Riverdale Medical Group uses and discloses health information as described in that notice.</p>
          </div>
        </>
      )}

      {/* Page number */}
      <div className="absolute bottom-2 right-3 text-[9px] text-gray-400 dark:text-gray-500">Page {page}</div>
    </div>
  );
}

export default function DemoPdfEditor() {
  const [activeTool, setActiveTool] = useState("Select");
  const [page, setPage] = useState<1 | 2>(1);

  return (
    <DemoShell
      toolName="PDF Editor"
      subtitle="Add text, highlight sections, mask sensitive data, and merge pages — all without leaving your browser."
      scenarioLabel="Patient consent form · 2 pages · Text, highlight, and mask annotations"
    >
      {/* Editor workspace */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border overflow-hidden shadow-lg"
      >
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/40 flex-wrap">
          {/* File info */}
          <div className="flex items-center gap-2 mr-3">
            <FileEdit className="w-4 h-4 text-orange-500 shrink-0" />
            <span className="text-xs font-semibold text-foreground">Patient_Consent_Form_Template.pdf</span>
            <Badge variant="outline" className="text-[10px]">2 pages</Badge>
          </div>

          <div className="w-px h-5 bg-border mx-1" />

          {/* Tool buttons */}
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.label;
            return (
              <button
                key={tool.label}
                onClick={() => setActiveTool(tool.label)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tool.label}</span>
              </button>
            );
          })}

          <div className="w-px h-5 bg-border mx-1" />

          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
            <Undo2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Undo</span>
          </button>

          <div className="ml-auto flex items-center gap-2">
            <Badge className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-300">
              Demo mode
            </Badge>
            <Button size="sm" variant="outline" disabled className="text-xs gap-1.5 opacity-50" title="Export disabled in demo">
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>

        {/* Main editor area */}
        <div className="flex bg-muted/20 min-h-[420px]">
          {/* Page canvas */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
            <PdfPageMockup page={page} />

            {/* Page controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 transition-all"
              >
                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              </button>
              <span className="text-xs text-muted-foreground">Page {page} of 2</span>
              <button
                onClick={() => setPage(2)}
                disabled={page === 2}
                className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 transition-all"
              >
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Right sidebar: annotations */}
          <div className="w-56 border-l border-border bg-card/60 p-4 hidden sm:block">
            <p className="text-xs font-semibold text-foreground mb-3">Annotations ({ANNOTATIONS.length})</p>
            <div className="space-y-2.5 mb-5">
              {ANNOTATIONS.map((ann, i) => {
                const AnnIcon = ann.icon;
                return (
                  <div key={i} className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 ${ann.color} text-xs font-medium`}>
                    <AnnIcon className="w-3.5 h-3.5 shrink-0" />
                    {ann.label}
                  </div>
                );
              })}
            </div>
            <div className="border-t border-border/60 pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Active tool</p>
              <p className="text-sm font-medium text-foreground">{activeTool}</p>
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center gap-3 px-4 py-2 border-t border-border bg-muted/30 text-[10px] text-muted-foreground flex-wrap">
          <span>3 annotations</span>
          <span>·</span>
          <span>Patient_Consent_Form_Template.pdf</span>
          <span className="ml-auto text-amber-600 dark:text-amber-400 font-medium">Demo mode — changes reset on refresh</span>
        </div>
      </motion.div>

      {/* Annotation legend below */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Type, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800", title: "Text added", desc: "\"John Smith\" typed into the Patient Name field." },
          { icon: Highlighter, color: "text-yellow-600 dark:text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800", title: "Section highlighted", desc: "Consent for treatment paragraph marked for review." },
          { icon: EyeOff, color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700", title: "Area masked", desc: "Date of birth and insurance ID obscured before sharing." },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.07 }}
              className={`rounded-xl border p-4 ${item.bg}`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Icon className={`w-4 h-4 ${item.color}`} />
                <span className={`text-xs font-semibold ${item.color}`}>{item.title}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </motion.div>
          );
        })}
      </div>
    </DemoShell>
  );
}
