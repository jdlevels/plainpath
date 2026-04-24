import { useState } from "react"
import {
  FileText, ArrowLeft, Check, ChevronRight, Shield,
  Users, DollarSign, Clock, AlertTriangle, Eye, Download,
  Sparkles, Lock, Zap,
} from "lucide-react"

const STEPS = [
  { id: "type",     label: "Contract Type",   icon: FileText,       done: true  },
  { id: "parties",  label: "Parties",         icon: Users,          done: true  },
  { id: "terms",    label: "Key Terms",       icon: DollarSign,     done: true  },
  { id: "clauses",  label: "Clauses",         icon: AlertTriangle,  done: false, active: true },
  { id: "review",   label: "Review & Export", icon: Eye,            done: false },
]

const CLAUSE_GROUPS = [
  {
    id: "payment",
    label: "Payment Terms",
    required: true,
    options: [
      { id: "net30",   label: "Net 30", desc: "Payment due 30 days after invoice" },
      { id: "net15",   label: "Net 15", desc: "Payment due 15 days after invoice", selected: true },
      { id: "upfront", label: "50% Upfront", desc: "Half before work, half on completion" },
    ],
  },
  {
    id: "revisions",
    label: "Revision Policy",
    required: true,
    options: [
      { id: "unlimited", label: "Unlimited revisions", desc: "No cap on change requests" },
      { id: "capped",    label: "Capped revisions", desc: "2 rounds of revisions included", selected: true },
      { id: "hourly",    label: "Billable revisions", desc: "Additional revisions billed at hourly rate" },
    ],
  },
  {
    id: "ip",
    label: "IP Ownership",
    required: true,
    options: [
      { id: "client",    label: "Client owns all IP", desc: "Full transfer upon payment", selected: true },
      { id: "freelancer", label: "Freelancer retains portfolio rights", desc: "Client gets license; freelancer can show in portfolio" },
      { id: "shared",    label: "Shared ownership", desc: "Both parties can use the work" },
    ],
  },
  {
    id: "dispute",
    label: "Dispute Resolution",
    required: false,
    options: [
      { id: "arbitration", label: "Binding arbitration", desc: "Private resolution, no court" },
      { id: "mediation",   label: "Mediation first", desc: "Try mediation before arbitration", selected: true },
      { id: "court",       label: "Court (jurisdiction)", desc: "Standard legal proceedings" },
    ],
  },
]

const SUMMARY = {
  type: "Freelance Service Agreement",
  parties: ["Alex Johnson (Freelancer)", "Bolt Creative Agency (Client)"],
  value: "$8,500",
  duration: "6 weeks",
  startDate: "August 1, 2025",
}

export function ContractBuilder() {
  const [activeStep, setActiveStep] = useState("clauses")
  const [selections, setSelections] = useState<Record<string, string>>(
    Object.fromEntries(CLAUSE_GROUPS.map(g => [g.id, g.options.find(o => o.selected)?.id ?? g.options[0].id]))
  )

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center gap-3 px-5 py-3 bg-slate-900 border-b border-slate-800">
        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="w-8 h-8 rounded-xl bg-violet-900/50 border border-violet-700/40 flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4 text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] text-slate-600 font-medium uppercase tracking-widest">Contract Builder</span>
          <h1 className="text-sm font-bold text-slate-100 truncate">Freelance Service Agreement</h1>
        </div>
        <div className="flex items-center gap-1.5">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700">
            <Eye className="w-3.5 h-3.5" /> Preview
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-colors">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[200px] flex-shrink-0 flex flex-col bg-slate-900 border-r border-slate-800">
          {/* Progress steps */}
          <div className="px-3 py-4 border-b border-slate-800/80 space-y-1">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-2">Progress</p>
            {STEPS.map((step, i) => (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors ${
                  step.active || activeStep === step.id
                    ? "bg-violet-900/40 text-violet-300"
                    : step.done
                    ? "text-slate-400 hover:bg-slate-800/50"
                    : "text-slate-600"
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                  step.done
                    ? "bg-emerald-600"
                    : step.active || activeStep === step.id
                    ? "bg-violet-600"
                    : "bg-slate-800 border border-slate-700"
                }`}>
                  {step.done ? <Check className="w-3 h-3 text-white" /> : <span className="text-[9px] font-bold text-slate-500">{i + 1}</span>}
                </div>
                <span className="text-xs font-medium flex-1">{step.label}</span>
                {(step.active || activeStep === step.id) && <ChevronRight className="w-3.5 h-3.5 text-violet-500" />}
              </button>
            ))}
          </div>

          {/* Contract summary */}
          <div className="px-3 py-3 border-b border-slate-800/80">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-2">Your Contract</p>
            <div className="space-y-1.5">
              <div>
                <p className="text-[9px] text-slate-600">Type</p>
                <p className="text-[11px] text-slate-300 font-medium">{SUMMARY.type}</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-600">Value</p>
                <p className="text-[11px] text-slate-300 font-medium">{SUMMARY.value}</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-600">Duration</p>
                <p className="text-[11px] text-slate-300 font-medium">{SUMMARY.duration}</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-600">Start Date</p>
                <p className="text-[11px] text-slate-300 font-medium">{SUMMARY.startDate}</p>
              </div>
            </div>
          </div>

          <div className="mx-3 mt-3 mb-3 p-3 rounded-xl bg-gradient-to-br from-violet-900/40 to-slate-800/80 border border-violet-800/40">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] font-bold text-violet-300 uppercase">AI Assist</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight mb-2">Let AI recommend clauses based on your contract type and value</p>
            <button className="w-full py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold">Suggest Clauses</button>
          </div>

          <div className="px-3 pb-3 mt-auto">
            <a href="#" className="flex items-center gap-1.5 text-[9px] text-slate-700 hover:text-slate-600">
              <Shield className="w-3 h-3" /> Reviewed by attorneys
            </a>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto bg-slate-950">
          <div className="max-w-3xl mx-auto px-6 py-6 space-y-5">
            <div className="flex items-center gap-2 mb-5">
              <AlertTriangle className="w-4 h-4 text-violet-400" />
              <h2 className="text-base font-bold text-slate-200">Choose Your Clauses</h2>
              <span className="ml-1 text-xs text-slate-600">Select the option that fits your situation</span>
            </div>

            {CLAUSE_GROUPS.map(group => (
              <div key={group.id} className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-800/60">
                  <span className="text-sm font-semibold text-slate-200">{group.label}</span>
                  {group.required && (
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-violet-900/50 text-violet-400">Required</span>
                  )}
                </div>
                <div className="divide-y divide-slate-800/40">
                  {group.options.map(option => {
                    const isSelected = selections[group.id] === option.id
                    return (
                      <button
                        key={option.id}
                        onClick={() => setSelections(s => ({ ...s, [group.id]: option.id }))}
                        className={`w-full flex items-center gap-4 px-5 py-3.5 text-left transition-colors ${
                          isSelected ? "bg-violet-950/30" : "hover:bg-slate-800/30"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? "border-violet-500 bg-violet-500" : "border-slate-700"
                        }`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${isSelected ? "text-violet-200" : "text-slate-300"}`}>{option.label}</p>
                          <p className="text-xs text-slate-500">{option.desc}</p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-violet-400 shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            <button className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-violet-700/50 bg-violet-600 hover:bg-violet-500 text-white font-bold transition-colors">
              Continue to Review <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}
