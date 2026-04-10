import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AppStoreBadge } from "@/components/ui/AppStoreBadge";
import { PlayStoreBadge } from "@/components/ui/PlayStoreBadge";
import {
  FileText, ShieldAlert, FileSignature, ShieldCheck,
  ArrowRight, Upload, Sparkles, Scale, Star,
  AlertTriangle, CheckCircle2, Clock, Lock,
} from "lucide-react";

/* ─── Animation helpers ──────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] },
  }),
};

/* ─── Tool pill data ─────────────────────────────────────── */
const TOOLS = [
  { label: "Analyze a Document", icon: FileText,      cls: "tool-btn-blue"    },
  { label: "Document Trust Check", icon: ShieldAlert, cls: "tool-btn-red"     },
  { label: "Build a Contract",    icon: FileSignature, cls: "tool-btn-emerald" },
  { label: "Contract Review",     icon: Scale,         cls: "tool-btn-amber"   },
];

/* ─── Feature cards ─────────────────────────────────────── */
const FEATURES = [
  {
    icon: FileText,
    color: "text-blue-600",
    bg: "bg-blue-100",
    border: "border-l-blue-500",
    accent: "bg-blue-500",
    glow: "from-blue-50",
    title: "Analyze a Document",
    desc: "Upload any letter, lease, permit, or notice. PlainPath extracts what it means, what you must do, and when — in plain English.",
    result: { label: "Action Step Extracted", value: "Sign and return the lease addendum before April 22nd.", icon: CheckCircle2, color: "text-blue-600", bg: "bg-blue-50" },
    tags: ["Leases", "Gov't letters", "Medical bills", "Court notices"],
    tagCls: "bg-blue-50/80 text-blue-700 border border-blue-200/60",
  },
  {
    icon: ShieldAlert,
    color: "text-red-600",
    bg: "bg-red-100",
    border: "border-l-red-500",
    accent: "bg-red-500",
    glow: "from-red-50",
    title: "Document Trust Check",
    desc: "Think a bill or letter looks suspicious? PlainPath scores it for legitimacy, surfaces red flags, and gives you a clear verdict.",
    result: { label: "Verdict Issued", value: "High scam risk — 3 fraud signals detected. Do not pay.", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
    tags: ["IRS letters", "Debt collectors", "Utility shutoffs", "Legal threats"],
    tagCls: "bg-red-50/80 text-red-700 border border-red-200/60",
  },
  {
    icon: Scale,
    color: "text-amber-600",
    bg: "bg-amber-100",
    border: "border-l-amber-500",
    accent: "bg-amber-500",
    glow: "from-amber-50",
    title: "Contract Review",
    desc: "Before you sign, PlainPath reads the fine print. It flags unfair clauses, identifies missing protections, and gives you negotiation language.",
    result: { label: "Clause Flagged", value: "5-year global non-compete — courts routinely reject this scope.", icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
    tags: ["Job offers", "Freelance deals", "NDAs", "Service agreements"],
    tagCls: "bg-amber-50/80 text-amber-700 border border-amber-200/60",
  },
  {
    icon: FileSignature,
    color: "text-emerald-600",
    bg: "bg-emerald-100",
    border: "border-l-emerald-500",
    accent: "bg-emerald-500",
    glow: "from-emerald-50",
    title: "Build a Contract",
    desc: "Answer plain-English questions about your deal. Get a complete, professional agreement with a gap analysis — ready to download and send.",
    result: { label: "Contract Ready", value: "Freelance Services Agreement · 6 clauses · Gap analysis complete.", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
    tags: ["Freelance work", "NDAs", "Rental agreements", "Payment plans"],
    tagCls: "bg-emerald-50/80 text-emerald-700 border border-emerald-200/60",
  },
];

/* ─── How it works ───────────────────────────────────────── */
const HOW = [
  { icon: Upload,       num: "01", title: "Upload or paste", desc: "Photo, PDF, or plain text — any format works." },
  { icon: Sparkles,     num: "02", title: "AI reads it for you", desc: "PlainPath extracts meaning, risks, and required actions." },
  { icon: CheckCircle2, num: "03", title: "Act with confidence", desc: "Clear summary, action checklist, deadlines — no jargon." },
];

/* ─── Trust stats ────────────────────────────────────────── */
const STATS = [
  { value: "4.9", label: "App Store rating" },
  { value: "2 min", label: "Average analysis time" },
  { value: "Zero", label: "Documents permanently stored" },
  { value: "Free", label: "First two analyses" },
];

/* ─── Component ──────────────────────────────────────────── */
export default function Home() {
  return (
    <div className="min-h-screen bg-background selection:bg-primary/20 selection:text-primary">
      <Navbar />

      {/* ════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════ */}
      <section className="relative pt-28 pb-0 md:pt-40 overflow-hidden">
        {/* Layered gradient — same palette as the main app, richer depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/80 via-indigo-50/70 to-violet-100/60 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-gradient-radial from-violet-200/30 to-transparent rounded-full blur-3xl pointer-events-none -translate-y-1/4 translate-x-1/4" />

        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-end">

            {/* ── Left col ── */}
            <motion.div initial="hidden" animate="visible" className="pb-20 md:pb-28">
              {/* Pill badge */}
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

              {/* Heading */}
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

              {/* Sub-copy */}
              <motion.p
                custom={2} variants={fadeUp}
                className="text-lg text-muted-foreground mb-6 leading-relaxed max-w-lg"
              >
                Leases, contracts, medical bills, court notices. PlainPath reads them for you,
                tells you exactly what to do next, and protects you from signing anything you shouldn't.
              </motion.p>

              {/* Tool pills */}
              <motion.div custom={3} variants={fadeUp} className="flex flex-wrap gap-2 mb-6">
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
              <motion.div custom={4} variants={fadeUp} className="flex flex-wrap gap-3 mb-6" id="download">
                <AppStoreBadge />
                <PlayStoreBadge />
              </motion.div>

              {/* Star rating + trust bar */}
              <motion.div custom={5} variants={fadeUp} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="text-sm font-semibold text-foreground ml-1">4.9</span>
                  <span className="text-xs text-muted-foreground">· App Store rating</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Free for your first 2 analyses — no account needed &nbsp;·&nbsp; Plans from $4.99/month to unlock more
                </p>
              </motion.div>
            </motion.div>

            {/* ── Right col — phone mockup, sits at the bottom ── */}
            <div className="relative lg:flex lg:justify-end pb-0">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full max-w-[360px] mx-auto lg:mx-0"
              >
                {/* Glow halo */}
                <div className="absolute -inset-8 bg-gradient-to-tr from-primary/15 via-violet-200/20 to-transparent rounded-[4rem] blur-3xl -z-10" />

                <img
                  src={`${import.meta.env.BASE_URL}images/mockup-1.png`}
                  alt="PlainPath app on iPhone"
                  className="w-full h-auto drop-shadow-2xl rounded-[2.5rem] border-[7px] border-white/95 object-cover aspect-[9/19.5]"
                />

                {/* Floating card 1 — action step */}
                <motion.div
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9, duration: 0.5 }}
                  className="absolute -left-12 top-[22%] bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-border/50 w-[180px]"
                >
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-foreground leading-tight">Action Step</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">Sign and return by Friday, April 14th.</p>
                    </div>
                  </div>
                </motion.div>

                {/* Floating card 2 — trust verdict */}
                <motion.div
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.1, duration: 0.5 }}
                  className="absolute -right-10 top-[55%] bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-border/50 w-[168px]"
                >
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-red-700 leading-tight">Scam Detected</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">3 red flags found. Do not pay.</p>
                    </div>
                  </div>
                </motion.div>

                {/* Floating card 3 — timing */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.3, duration: 0.5 }}
                  className="absolute -left-6 bottom-[12%] bg-white/95 backdrop-blur-md px-3 py-2 rounded-2xl shadow-xl border border-border/50 flex items-center gap-2"
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <Clock className="w-3 h-3 text-emerald-600" />
                  </div>
                  <p className="text-[11px] font-semibold text-foreground">Ready in ~90 sec</p>
                </motion.div>
              </motion.div>
            </div>

          </div>
        </div>

        {/* Bottom fade into next section — seamless transition */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-background pointer-events-none" />
      </section>

      {/* ════════════════════════════════════════════════
          STATS STRIP — bridges hero to content
      ════════════════════════════════════════════════ */}
      <div className="border-y border-border/60 bg-white/60 backdrop-blur-sm py-8">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x divide-border/50">
            {STATS.map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center text-center px-6">
                <span className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>{value}</span>
                <span className="text-xs text-muted-foreground mt-1">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          FOUR TOOLS — premium cards
      ════════════════════════════════════════════════ */}
      <section id="features" className="py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-3">Four tools · one platform</p>
            <h2
              className="text-4xl md:text-5xl font-bold mb-4 text-foreground"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Every document situation,{" "}
              <span
                className="bg-gradient-to-r from-primary via-blue-500 to-violet-500 bg-clip-text text-transparent"
                style={{ WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
              >
                covered.
              </span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Whether you're reading, verifying, building, or negotiating — PlainPath has a tool for it.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {FEATURES.map(({ icon: Icon, color, bg, border, accent, glow, title, desc, result, tags, tagCls }, i) => {
              const ResultIcon = result.icon;
              return (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.07 }}
                  whileHover={{ y: -3 }}
                  className={`bg-card rounded-2xl border-l-4 ${border} border border-border/60 shadow-sm relative overflow-hidden group h-full`}
                >
                  {/* Subtle color glow in corner */}
                  <div className={`absolute top-0 right-0 w-56 h-56 bg-gradient-to-bl ${glow} to-transparent opacity-50 group-hover:opacity-80 transition-opacity duration-300`} />

                  <div className="relative z-10 p-7 flex flex-col h-full">
                    {/* Icon + title row — fixed height, always aligned */}
                    <div className="flex items-center gap-3.5 mb-4">
                      <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
                        <Icon className={`w-5 h-5 ${color}`} />
                      </div>
                      <div>
                        <h3
                          className="text-lg font-bold text-foreground leading-tight"
                          style={{ fontFamily: "var(--font-display)" }}
                        >
                          {title}
                        </h3>
                        <div className={`h-0.5 w-8 ${accent} rounded-full mt-1.5 opacity-60`} />
                      </div>
                    </div>

                    {/* Description — grows to fill available space so result box always at same vertical position */}
                    <p className="text-muted-foreground text-sm leading-relaxed mb-5 flex-1">{desc}</p>

                    {/* Result preview */}
                    <div className={`${result.bg} rounded-xl p-3.5 mb-4 border border-border/40`}>
                      <div className="flex items-start gap-2.5">
                        <ResultIcon className={`w-4 h-4 ${result.color} mt-0.5 shrink-0`} />
                        <div>
                          <p className={`text-[11px] font-semibold ${result.color} uppercase tracking-wide mb-0.5`}>{result.label}</p>
                          <p className="text-xs text-foreground leading-relaxed font-medium">"{result.value}"</p>
                        </div>
                      </div>
                    </div>

                    {/* Tags — pinned to the bottom of every card */}
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map(t => (
                        <span key={t} className={`px-2 py-0.5 ${tagCls} rounded-md text-[11px] font-medium`}>{t}</span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          HOW IT WORKS — flows naturally from tools
      ════════════════════════════════════════════════ */}
      <div
        id="how-it-works"
        className="w-full bg-gradient-to-b from-slate-100/90 via-blue-50/50 to-slate-100/70 border-y border-slate-200/80 py-16"
      >
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-12">
            How it works
          </p>
          <div className="grid md:grid-cols-3 gap-6 relative">
            <div className="hidden md:block absolute top-8 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-gradient-to-r from-border via-primary/30 to-border" />
            {HOW.map(({ icon: Icon, num, title, desc }) => (
              <div key={num} className="flex flex-col items-center text-center gap-3 relative">
                <div className="w-16 h-16 rounded-2xl bg-white border border-border/60 shadow-sm flex flex-col items-center justify-center gap-0.5">
                  <Icon className="w-6 h-6 text-primary" />
                  <span className="text-[9px] font-bold text-muted-foreground tracking-widest">{num}</span>
                </div>
                <p className="font-semibold text-foreground text-sm">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          APP SHOWCASE — web + mobile
      ════════════════════════════════════════════════ */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative order-2 lg:order-1">
              <div className="absolute -inset-3 bg-gradient-to-tr from-emerald-100/40 via-blue-50/30 to-transparent rounded-3xl blur-xl -z-10" />
              <img
                src={`${import.meta.env.BASE_URL}images/mockup-2.png`}
                alt="PlainPath web app"
                className="w-full h-auto rounded-2xl shadow-2xl border border-border/50 object-cover"
              />
            </div>
            <div className="max-w-lg order-1 lg:order-2">
              <p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-3">Web &amp; Mobile</p>
              <h2
                className="text-3xl md:text-4xl font-bold mb-5 text-foreground"
                style={{ fontFamily: "var(--font-display)" }}
              >
                One platform, every device.
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Start on your phone with a photo. Finish on your laptop.
                PlainPath feels fast and natural everywhere — try it free, no account needed to start.
              </p>
              <div className="space-y-4 mb-8">
                {[
                  { icon: Upload,       text: "Upload a photo, PDF, or paste text" },
                  { icon: Sparkles,     text: "AI analyzes in under 2 minutes" },
                  { icon: CheckCircle2, text: "Plain English summary + action plan" },
                ].map(({ icon: Icon, text }, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm text-foreground font-medium">{text}</span>
                  </div>
                ))}
              </div>
              <a
                href="https://plain-path.replit.app"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                Try the web app free <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          PRIVACY — distinct section with strong anchor
      ════════════════════════════════════════════════ */}
      <div className="w-full bg-gradient-to-br from-indigo-50/90 via-violet-50/70 to-slate-50/90 border-y border-indigo-100 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="w-16 h-16 bg-foreground rounded-2xl flex items-center justify-center shrink-0">
              <Lock className="w-8 h-8 text-background" />
            </div>
            <div>
              <h2
                className="text-2xl md:text-3xl font-bold mb-3 text-foreground"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Your documents aren't permanently stored.
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We don't sell your data. We don't train AI on your documents.
                Your contracts, bills, and notices belong to you.
                We process them to give you answers — then they stay secure.
              </p>
              <div className="flex flex-wrap gap-6 text-sm font-medium text-foreground">
                {["Not sold", "Not shared", "Not used for training", "Encrypted in transit"].map(item => (
                  <span key={item} className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-primary" /> {item}
                  </span>
                ))}
              </div>
              <a
                href="https://plain-path.replit.app/privacy"
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                Read our Privacy Policy <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          FINAL CTA — dark, premium
      ════════════════════════════════════════════════ */}
      <div className="w-full bg-gradient-to-br from-slate-950 via-[#0c1525] to-violet-950/40 border-t border-white/5 py-28">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="flex justify-center mb-6">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <p className="text-xs font-semibold tracking-[0.12em] uppercase text-white/40 mb-4">Download today — it's free to start</p>
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
          <p className="text-lg text-white/60 mb-10 max-w-xl mx-auto leading-relaxed">
            Never sign something confusing again. PlainPath reads it so you don't have to.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <AppStoreBadge />
            <PlayStoreBadge />
          </div>
          <p className="mt-6 text-xs text-white/30">
            Free for your first 2 analyses &nbsp;·&nbsp; Plans from $4.99/month &nbsp;·&nbsp; No account needed to try
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
