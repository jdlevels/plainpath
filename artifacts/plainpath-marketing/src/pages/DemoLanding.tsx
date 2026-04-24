import { motion } from "framer-motion";
import {
  FileScan, ShieldCheck, PenLine, Scale, EyeOff,
  GitCompare, ListChecks, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const TOOLS = [
  {
    key: "analyze",
    label: "Analyze a Document",
    scenario: "Residential lease — Unit 4B, Austin TX",
    desc: "Get a plain-English breakdown of a 12-page lease: risks, deadlines, action items, and what to ask before signing.",
    icon: FileScan,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-800",
    ring: "hover:ring-blue-300 dark:hover:ring-blue-700",
    href: "/demo/analyze",
  },
  {
    key: "trust-check",
    label: "Document Trust Check",
    scenario: "Fake IRS payment demand — scored 18/100",
    desc: "See how PlainPath flags a scam letter pretending to be from the IRS, with 4 flags detected — 3 critical, 1 high.",
    icon: ShieldCheck,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/40",
    border: "border-red-200 dark:border-red-800",
    ring: "hover:ring-red-300 dark:hover:ring-red-700",
    href: "/demo/trust-check",
  },
  {
    key: "build-contract",
    label: "Build a Contract",
    scenario: "Freelance web design — Meridian Coffee Roasters",
    desc: "A 6-question wizard produced a complete Freelance Services Agreement with IP ownership, payment terms, and revision policy.",
    icon: PenLine,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800",
    ring: "hover:ring-emerald-300 dark:hover:ring-emerald-700",
    href: "/demo/build-contract",
  },
  {
    key: "contract-review",
    label: "Contract Review",
    scenario: "Employment offer — scored 28/100",
    desc: "PlainPath flags a 5-year global non-compete, overly broad IP assignment, and mandatory arbitration — with negotiation language ready.",
    icon: Scale,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800",
    ring: "hover:ring-amber-300 dark:hover:ring-amber-700",
    href: "/demo/contract-review",
  },
  {
    key: "redact",
    label: "Redact Sensitive Info",
    scenario: "Medical intake form — 3 PII items found",
    desc: "PlainPath detects a SSN, insurance ID, and date of birth automatically. Review and approve each redaction before exporting.",
    icon: EyeOff,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/40",
    border: "border-violet-200 dark:border-violet-800",
    ring: "hover:ring-violet-300 dark:hover:ring-violet-700",
    href: "/demo/redact",
  },
  {
    key: "compare",
    label: "Compare Versions",
    scenario: "NDA v1 vs v2 — 3 changes, 1 critical",
    desc: "A confidentiality term quietly changed from 2 years to perpetuity. PlainPath surfaces the change and explains why it matters.",
    icon: GitCompare,
    color: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-50 dark:bg-teal-950/40",
    border: "border-teal-200 dark:border-teal-800",
    ring: "hover:ring-teal-300 dark:hover:ring-teal-700",
    href: "/demo/compare",
  },
  {
    key: "clause-extractor",
    label: "Clause Extractor",
    scenario: "Residential lease — 6 obligations extracted",
    desc: "See how PlainPath structures a 12-page lease into key dates, party roles, financial terms, and a plain-English obligation checklist.",
    icon: ListChecks,
    color: "text-fuchsia-600 dark:text-fuchsia-400",
    bg: "bg-fuchsia-50 dark:bg-fuchsia-950/40",
    border: "border-fuchsia-200 dark:border-fuchsia-800",
    ring: "hover:ring-fuchsia-300 dark:hover:ring-fuchsia-700",
    href: "/demo/clause-extractor",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.4 } }),
};

export default function DemoLanding() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 mt-16">
        {/* Hero */}
        <section className="pt-14 pb-10 px-4 text-center bg-gradient-to-b from-blue-50/60 via-background to-background dark:from-slate-900 dark:to-background border-b border-border/40">
          <div className="max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 rounded-full px-4 py-1.5 mb-5">
              7 tools · all pre-loaded
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight" style={{ fontFamily: "var(--font-display)" }}>
              See PlainPath in action
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-7 leading-relaxed">
              Each demo opens a realistic sample scenario — already populated with results. No sign-up, no upload needed.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button asChild size="lg" className="rounded-full px-7 gap-2 font-semibold shadow-sm">
                <a href="/app/sign-up">
                  Start free
                  <ArrowRight className="w-4 h-4" />
                </a>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full px-7 font-medium">
                <a href="/#pricing">See pricing</a>
              </Button>
            </div>
          </div>
        </section>

        {/* Tool cards */}
        <section className="py-14 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {TOOLS.map((tool, i) => {
                const Icon = tool.icon;
                return (
                  <motion.a
                    key={tool.key}
                    href={tool.href}
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    variants={fadeUp}
                    className={`group flex flex-col rounded-2xl border ${tool.border} ${tool.bg} p-5 transition-all duration-200 hover:shadow-lg hover:ring-2 ${tool.ring} cursor-pointer`}
                  >
                    <div className={`w-10 h-10 rounded-xl ${tool.bg} border ${tool.border} flex items-center justify-center mb-3 shrink-0`}>
                      <Icon className={`w-5 h-5 ${tool.color}`} />
                    </div>
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${tool.color}`}>
                      {tool.label}
                    </p>
                    <p className="text-xs font-semibold text-muted-foreground mb-2 leading-snug">{tool.scenario}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-4">{tool.desc}</p>
                    <div className={`flex items-center gap-1.5 text-sm font-semibold ${tool.color} mt-auto`}>
                      Open demo
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </motion.a>
                );
              })}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-12 px-4 border-t border-border/40 bg-gradient-to-b from-background to-indigo-50/40 dark:to-slate-900/60">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: "var(--font-display)" }}>
              Use your own document in the full app
            </h2>
            <p className="text-muted-foreground mb-6">
              Upload any PDF — lease, contract, medical bill, or letter — and get results in under 2 minutes. Free to start.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button asChild className="rounded-full px-8 font-semibold gap-2 shadow-sm">
                <a href="/app/sign-up">Start free <ArrowRight className="w-4 h-4" /></a>
              </Button>
              <Button asChild variant="outline" className="rounded-full px-8 font-medium">
                <a href="/#pricing">See pricing</a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
