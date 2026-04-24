import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"
import React from "react"

const TOOL_ROWS: { color: string; name: string; desc: string }[] = [
  {
    color: "text-blue-600 dark:text-blue-400",
    name: "Analyze a Document",
    desc: "breaks down paperwork you already have — extracting action steps, deadlines, risks, and required items in plain English.",
  },
  {
    color: "text-red-600 dark:text-red-400",
    name: "Document Trust Check",
    desc: "scores whether a document appears legitimate or shows scam and fraud indicators. Get a clear verdict before paying or responding.",
  },
  {
    color: "text-emerald-600 dark:text-emerald-400",
    name: "Build a Contract",
    desc: "creates a new agreement from scratch based on your deal terms — with a gap analysis to flag what's missing.",
  },
  {
    color: "text-amber-600 dark:text-amber-400",
    name: "Contract Review",
    desc: "reads a contract someone else wrote, flags risky or missing clauses, scores it for fairness, and gives you negotiation language.",
  },
  {
    color: "text-violet-600 dark:text-violet-400",
    name: "Redact Sensitive Info",
    desc: "detects and removes personal information — names, SSNs, account numbers, and more — before you share or analyze a document.",
  },
  {
    color: "text-sky-600 dark:text-sky-400",
    name: "Compare Versions",
    desc: "maps every addition, deletion, and structural change between two document versions — with severity scoring so you see what actually matters.",
  },
  {
    color: "text-fuchsia-600 dark:text-fuchsia-400",
    name: "Clause Extractor",
    desc: "pulls every obligation, key date, party, and financial term from a contract — and tells you exactly who owes what by when.",
  },
]

const TOOLS_ANSWER: React.ReactNode = (
  <ul className="space-y-3 mt-1">
    {TOOL_ROWS.map(({ color, name, desc }) => (
      <li key={name} className="flex gap-2 text-sm leading-relaxed">
        <span className={`font-semibold shrink-0 ${color}`}>{name}</span>
        <span className="text-muted-foreground dark:text-muted-foreground/85">— {desc}</span>
      </li>
    ))}
  </ul>
)

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: "Does PlainPath store my documents?",
    a: "No. Your document text is sent to our AI for analysis and then discarded — we never permanently store the content of your documents. Your analysis results are saved to your private history so you can reference them later. They are never shared or used for AI training.",
  },
  {
    q: "Who can see my document or analysis?",
    a: "Only you. Documents are processed to generate your results and then discarded — not used for AI training, not shared with third parties. Your analysis results are saved to your private history and are never visible to anyone else.",
  },
  {
    q: "What kinds of documents work best?",
    a: "PlainPath works with leases, employment contracts, healthcare forms, government applications, grant packets, legal agreements, tax notices, and more. If it's text-based and has requirements, deadlines, or legalese — it works.",
  },
  {
    q: "What's the difference between the seven tools?",
    a: TOOLS_ANSWER,
  },
  {
    q: "Is the output legal advice?",
    a: "No. PlainPath helps you understand documents in plain English and flags things to pay attention to, but it is not a substitute for legal counsel. For significant legal matters, always consult a licensed attorney.",
  },
  {
    q: "What file types are supported?",
    a: "You can upload PDF and Word (.docx) files, or paste text directly. Scanned image-only PDFs without a text layer may produce limited results.",
  },
  {
    q: "Can I use PlainPath on my phone?",
    a: "Yes — the web app is mobile-friendly. Native iOS and Android apps are on the roadmap.",
  },
  {
    q: "Which plan do I need for each tool?",
    a: "Analyze a Document and Redact Sensitive Info are available on Starter and Pro plans. Document Trust Check, Build a Contract, Contract Review, Compare Versions, and Clause Extractor require a Pro plan. You'll see an upgrade prompt if you try to use them without Pro, and you can switch plans at any time.",
  },
]

function FAQItem({ q, a, index }: { q: string; a: React.ReactNode; index: number }) {
  const [open, setOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className="border-b border-border/50 last:border-0"
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-5 text-left gap-4 group"
      >
        <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
          {q}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="text-sm text-muted-foreground dark:text-muted-foreground/85 leading-relaxed pb-5">
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function FAQSection() {
  return (
    <section className="max-w-3xl w-full mx-auto">
      <div className="text-center mb-10">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3"
        >
          FAQ
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Questions we hear a lot
        </motion.h2>
      </div>

      <div className="bg-white dark:bg-card border border-border/50 rounded-2xl shadow-md px-6 divide-y-0">
        {FAQS.map((faq, i) => (
          <FAQItem key={i} q={faq.q} a={faq.a} index={i} />
        ))}
      </div>
    </section>
  )
}
