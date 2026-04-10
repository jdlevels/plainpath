import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AppStoreBadge } from "@/components/ui/AppStoreBadge";
import { PlayStoreBadge } from "@/components/ui/PlayStoreBadge";
import {
  FileText, ShieldAlert, FileSignature, ShieldCheck,
  CheckCircle2, ArrowRight, Upload, Sparkles, Scale,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] },
  }),
};

const TOOLS = [
  {
    label: "Analyze a Document",
    icon: FileText,
    cls: "tool-btn-blue",
  },
  {
    label: "Document Trust Check",
    icon: ShieldAlert,
    cls: "tool-btn-red",
  },
  {
    label: "Build a Contract",
    icon: FileSignature,
    cls: "tool-btn-emerald",
  },
  {
    label: "Contract Review",
    icon: Scale,
    cls: "tool-btn-amber",
  },
];

const FEATURES = [
  {
    icon: FileText,
    color: "text-blue-600",
    bg: "bg-blue-100",
    glow: "bg-blue-50",
    title: "Analyze a Document",
    desc: "Snap a photo or upload any paperwork. Get a plain-English summary, every action step, and critical deadlines — in seconds.",
    tags: ["Leases", "Letters", "Notices"],
    tagCls: "bg-blue-50 text-blue-700",
  },
  {
    icon: ShieldAlert,
    color: "text-red-600",
    bg: "bg-red-100",
    glow: "bg-red-50",
    title: "Document Trust Check",
    desc: "Suspect a scam? Run a Trust Check to detect fraud patterns, verify the sender, and get a clear verdict before you respond or pay.",
    tags: ["Scam Detection", "Verification"],
    tagCls: "bg-red-50 text-red-700",
  },
  {
    icon: Scale,
    color: "text-amber-600",
    bg: "bg-amber-100",
    glow: "bg-amber-50",
    title: "Contract Review",
    desc: "Before you sign, let us read the fine print. We flag unfair clauses, missing protections, and hand you specific negotiation language.",
    tags: ["Job Offers", "Agreements"],
    tagCls: "bg-amber-50 text-amber-700",
  },
  {
    icon: FileSignature,
    color: "text-emerald-600",
    bg: "bg-emerald-100",
    glow: "bg-emerald-50",
    title: "Build a Contract",
    desc: "Answer plain-English questions about your deal. Get a complete, professional agreement — with a gap analysis — ready to download.",
    tags: ["Freelance", "NDAs", "Leases"],
    tagCls: "bg-emerald-50 text-emerald-700",
  },
];

const HOW = [
  { num: "1", icon: Upload, title: "Upload or paste your document", desc: "Snap a photo, upload a file, or paste text directly." },
  { num: "2", icon: Sparkles, title: "AI reads it for you", desc: "PlainPath extracts the meaning, risks, and required actions." },
  { num: "3", icon: CheckCircle2, title: "Act with confidence", desc: "Clear summary, action checklist, and deadlines — no jargon." },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background selection:bg-primary/20 selection:text-primary">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────── */}
      <section className="relative pt-28 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        {/* Same gradient as the main app hero */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/70 via-indigo-50/60 to-violet-100/50 pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left — text */}
          <motion.div initial="hidden" animate="visible" className="max-w-xl">
            {/* Pill badge — same style as main app */}
            <motion.div
              custom={0} variants={fadeUp}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              NOW ON iOS &amp; ANDROID
            </motion.div>

            {/* Heading — Instrument Sans, gradient text on key phrase */}
            <motion.h1
              custom={1} variants={fadeUp}
              className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight mb-6 text-foreground"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Stop guessing what{" "}
              <span
                className="bg-gradient-to-r from-primary via-blue-500 to-violet-500 bg-clip-text text-transparent"
                style={{ WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
              >
                your documents
              </span>{" "}
              mean.
            </motion.h1>

            <motion.p
              custom={2} variants={fadeUp}
              className="text-lg text-muted-foreground mb-8 leading-relaxed"
            >
              PlainPath is a four-tool document platform. Analyze any paperwork,
              verify its legitimacy, build contracts, and review agreements before
              you sign — all turned into plain English and clear action.
            </motion.p>

            {/* Tool pills — exact same CSS classes as the main app */}
            <motion.div
              custom={3} variants={fadeUp}
              className="flex flex-wrap gap-2 mb-8"
            >
              {TOOLS.map(({ label, icon: Icon, cls }) => (
                <a
                  key={label}
                  href="https://plain-path.replit.app"
                  target="_blank"
                  rel="noreferrer"
                  className={`${cls} inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-sm font-medium transition-opacity hover:opacity-80`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </a>
              ))}
            </motion.div>

            {/* Download badges */}
            <motion.div
              custom={4} variants={fadeUp}
              className="flex flex-wrap gap-3 mb-6"
              id="download"
            >
              <AppStoreBadge />
              <PlayStoreBadge />
            </motion.div>

            {/* Trust bar — same dot-separated style as main app */}
            <motion.p
              custom={5} variants={fadeUp}
              className="text-xs text-muted-foreground"
            >
              Plans from $4.99/month &nbsp;•&nbsp; No account required &nbsp;•&nbsp;
              Documents not stored by PlainPath &nbsp;•&nbsp; Free for your first two analyses
            </motion.p>
          </motion.div>

          {/* Right — phone mockup */}
          <motion.div
            initial={{ opacity: 0, x: 20, rotate: 1.5 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="relative lg:ml-auto w-full max-w-[380px] mx-auto"
          >
            <div className="absolute -inset-6 bg-gradient-to-tr from-primary/10 via-violet-200/20 to-transparent rounded-[3.5rem] blur-3xl -z-10" />
            <img
              src={`${import.meta.env.BASE_URL}images/mockup-1.png`}
              alt="PlainPath app on iPhone"
              className="w-full h-auto drop-shadow-2xl rounded-[3rem] border-8 border-white object-cover aspect-[3/4]"
            />
            {/* Floating card — same white card style as main app */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85, duration: 0.6 }}
              className="absolute -left-10 top-1/4 bg-white/90 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-border/60 max-w-[190px]"
            >
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Action Step Found</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">Sign and return by Friday the 14th.</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────── */}
      <div
        id="how-it-works"
        className="w-full bg-gradient-to-b from-slate-100/90 via-blue-50/50 to-slate-100/70 border-y border-slate-200 py-14"
      >
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-10">
            How it works
          </p>
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-7 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-gradient-to-r from-border via-primary/30 to-border" />
            {HOW.map(({ num, icon: Icon, title, desc }) => (
              <div key={num} className="flex flex-col items-center text-center gap-3 relative">
                <div className="w-14 h-14 rounded-2xl bg-white border border-border/60 shadow-sm flex items-center justify-center">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <p className="font-semibold text-foreground">{title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Four Tools ────────────────────────────────── */}
      <section id="features" className="py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-3">Four tools · one platform</p>
            <h2
              className="text-4xl md:text-5xl font-bold mb-4 text-foreground"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Everything you need to{" "}
              <span
                className="bg-gradient-to-r from-primary via-blue-500 to-violet-500 bg-clip-text text-transparent"
                style={{ WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
              >
                read the fine print.
              </span>
            </h2>
            <p className="text-lg text-muted-foreground">Navigate any document with confidence — no legal degree required.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {FEATURES.map(({ icon: Icon, color, bg, glow, title, desc, tags, tagCls }) => (
              <motion.div
                key={title}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="bg-card rounded-2xl p-8 shadow-sm border border-border/60 relative overflow-hidden group"
              >
                <div className={`absolute top-0 right-0 w-48 h-48 ${glow} rounded-full blur-3xl -mr-16 -mt-16 opacity-70 transition-transform duration-300 group-hover:scale-125`} />
                <div className="relative z-10">
                  <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center mb-6`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                  </div>
                  <h3
                    className="text-xl font-bold mb-3 text-foreground"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {title}
                  </h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">{desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(t => (
                      <span key={t} className={`px-2.5 py-1 ${tagCls} rounded-full text-xs font-medium`}>{t}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── App showcase ──────────────────────────────── */}
      <div className="w-full bg-gradient-to-b from-slate-100 via-blue-50/80 to-slate-100/60 border-y border-slate-200 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-100/40 to-transparent rounded-2xl -z-10" />
              <img
                src={`${import.meta.env.BASE_URL}images/mockup-2.png`}
                alt="PlainPath web app"
                className="w-full h-auto rounded-2xl shadow-xl border border-border/50 object-cover"
              />
            </div>
            <div className="max-w-lg">
              <p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-3">Web &amp; Mobile</p>
              <h2
                className="text-3xl md:text-4xl font-bold mb-4 text-foreground"
                style={{ fontFamily: "var(--font-display)" }}
              >
                A clean experience on every device.
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Whether you're uploading on your phone or building a contract on your laptop,
                PlainPath feels natural and fast. Start on iOS, finish on the web — your work follows you.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Upload or snap a photo of your document",
                  "PlainPath analyzes it in plain English",
                  "Get your summary, action steps, and deadlines",
                ].map((step, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-primary text-xs font-bold">{i + 1}</span>
                    </div>
                    <span className="text-sm text-foreground font-medium">{step}</span>
                  </li>
                ))}
              </ul>
              <a
                href="https://plain-path.replit.app"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                Try the web app <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Privacy ───────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="w-14 h-14 bg-foreground rounded-xl flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-7 h-7 text-background" />
          </div>
          <h2
            className="text-3xl md:text-4xl font-bold mb-4 text-foreground"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Your documents are private.
          </h2>
          <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
            We don't sell your data. We don't train AI on your documents.
            Your contracts, bills, and notices belong to you — we process them to give you answers, then keep them secure.
          </p>
          <a
            href="https://plain-path.replit.app/privacy"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            Read our Privacy Policy <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────── */}
      <div className="w-full bg-gradient-to-br from-slate-950 via-[#0c1525] to-violet-950/40 border-t border-white/5 py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-xs font-semibold tracking-[0.12em] uppercase text-white/40 mb-4">Download today</p>
          <h2
            className="text-4xl md:text-5xl font-bold mb-4 text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Ready for{" "}
            <span
              className="bg-gradient-to-r from-primary via-blue-400 to-violet-400 bg-clip-text text-transparent"
              style={{ WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
            >
              absolute clarity?
            </span>
          </h2>
          <p className="text-lg text-white/60 mb-10 max-w-xl mx-auto">
            Download the app and never sign a confusing document again.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <AppStoreBadge />
            <PlayStoreBadge />
          </div>
          <p className="mt-6 text-xs text-white/30">
            Plans from $4.99/month &nbsp;•&nbsp; Free for your first two analyses
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
