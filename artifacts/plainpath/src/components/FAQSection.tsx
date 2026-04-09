import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"

const FAQS = [
  {
    q: "Does PlainPath store my documents?",
    a: "No. Your document content is sent to our AI for analysis and then discarded. We never store the text of your documents on our servers. Your analysis results are saved locally on your device only (Pro: optional cloud backup).",
  },
  {
    q: "Who can see my document or analysis?",
    a: "Only you. Documents are processed privately, not used for training, and not shared with any third party. Analysis results live on your device unless you explicitly share a link.",
  },
  {
    q: "What kinds of documents work best?",
    a: "PlainPath works with leases, employment contracts, healthcare forms, government applications, grant packets, legal agreements, tax notices, and more. If it's text-based and has requirements, deadlines, or legalese — it works.",
  },
  {
    q: "What's the difference between the four tools?",
    a: "Analyze a Document breaks down paperwork you already have — extracting action steps, deadlines, risks, and required documents in plain English. Document Trust Check scores whether a document appears legitimate or shows scam and fraud indicators. Build a Contract creates a new agreement from scratch based on your deal terms, with a gap analysis. Contract Review reads a contract someone else wrote, flags risky or missing clauses, scores it, and gives you negotiation language.",
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
    a: "Analyze a Document is available on all plans, including Free (first two analyses). Document Trust Check, Build a Contract, and Contract Review are available on Pro and Team plans. You'll see an upgrade prompt if you try to use them on a lower tier, and you can switch plans at any time.",
  },
]

function FAQItem({ q, a, index }: { q: string; a: string; index: number }) {
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
            <p className="text-sm text-muted-foreground dark:text-muted-foreground/85 leading-relaxed pb-5">
              {a}
            </p>
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
          className="text-3xl md:text-4xl font-display font-bold"
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
