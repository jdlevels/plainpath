import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Play, X, FileText, ShieldCheck, PenLine,
  Clock, AlertTriangle, Calendar, CheckCircle2, ChevronDown,
} from "lucide-react"

/* ── Drop in EITHER a YouTube embed URL or a direct MP4/WebM path ──────────
   YouTube:  "https://www.youtube.com/embed/XXXX"
   MP4 file: "/assets/demo.mp4"  or  "https://cdn.example.com/demo.mp4"
   Leave empty → thumbnail shows "Try it live" CTA instead of a play button. */
const DEMO_VIDEO_URL = ""

const CHAPTERS = [
  {
    id: 0,
    icon: FileText,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    activeBorder: "border-blue-400/50",
    activeBg: "bg-blue-500/8",
    time: "0:00",
    duration: "0:48",
    label: "Analyze a Document",
    desc: "Upload any notice or form, get prioritized action steps and deadlines.",
  },
  {
    id: 1,
    icon: ShieldCheck,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    activeBorder: "border-violet-400/50",
    activeBg: "bg-violet-500/8",
    time: "0:48",
    duration: "0:36",
    label: "Document Trust Check",
    desc: "Spot fake or predatory documents before you act on them.",
  },
  {
    id: 2,
    icon: PenLine,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    activeBorder: "border-emerald-400/50",
    activeBg: "bg-emerald-500/8",
    time: "1:24",
    duration: "0:54",
    label: "Build a Contract",
    desc: "Answer 5 questions. Get a complete, gap-checked contract draft.",
  },
]

/* ── Simulated PlainPath UI thumbnail shown before play ── */
function ThumbnailPreview({ onPlay, hasVideo }: { onPlay: () => void; hasVideo: boolean }) {
  return (
    <div
      className="relative w-full aspect-video bg-slate-950 overflow-hidden cursor-pointer select-none group"
      onClick={onPlay}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#0d1526] to-slate-950" />
      <div className="absolute top-0 right-0 w-[600px] h-[400px] rounded-full bg-primary/8 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[300px] rounded-full bg-violet-500/6 blur-3xl pointer-events-none" />

      {/* Simulated app UI — fades on hover */}
      <div className="absolute inset-0 flex items-center justify-center gap-5 px-10 py-6 opacity-45 group-hover:opacity-20 transition-opacity duration-300">
        {/* Left: document preview */}
        <div className="w-[36%] h-[85%] bg-slate-800/70 rounded-2xl border border-slate-700/50 p-4 overflow-hidden flex flex-col">
          <div className="flex items-center gap-1.5 mb-3">
            <div className="w-2 h-2 rounded-full bg-red-400/80" />
            <div className="w-2 h-2 rounded-full bg-amber-400/80" />
            <div className="w-2 h-2 rounded-full bg-emerald-400/80" />
            <span className="ml-2 text-[9px] text-slate-500 font-mono">eviction_notice.pdf</span>
          </div>
          <div className="space-y-1.5 flex-1">
            {[
              { w: "w-full",  hl: false, c: "" },
              { w: "w-5/6",  hl: false, c: "" },
              { w: "w-full",  hl: true,  c: "bg-amber-400/30" },
              { w: "w-4/5",  hl: false, c: "" },
              { w: "w-full",  hl: false, c: "" },
              { w: "w-3/4",  hl: true,  c: "bg-red-400/25" },
              { w: "w-full",  hl: false, c: "" },
              { w: "w-5/6",  hl: false, c: "" },
              { w: "w-full",  hl: true,  c: "bg-blue-400/25" },
              { w: "w-2/3",  hl: false, c: "" },
              { w: "w-full",  hl: false, c: "" },
              { w: "w-4/5",  hl: false, c: "" },
            ].map((line, i) => (
              <div key={i} className={`h-1.5 rounded-full ${line.w} ${line.hl ? line.c : "bg-slate-700/80"}`} />
            ))}
          </div>
        </div>

        {/* Right: extracted results */}
        <div className="w-[36%] h-[85%] flex flex-col gap-2">
          {[
            { icon: Clock,         color: "text-red-400",     bg: "bg-red-500/10",    border: "border-red-500/25",   label: "14 days to respond · URGENT" },
            { icon: AlertTriangle, color: "text-amber-400",   bg: "bg-amber-500/10",  border: "border-amber-500/20", label: "Risk: default judgment"       },
            { icon: FileText,      color: "text-blue-400",    bg: "bg-blue-500/10",   border: "border-blue-500/20",  label: "Required: Form UD-105"        },
            { icon: Calendar,      color: "text-slate-400",   bg: "bg-slate-700/40",  border: "border-slate-600/30", label: "Court date: May 22, 2026"     },
            { icon: CheckCircle2,  color: "text-emerald-400", bg: "bg-emerald-500/10",border: "border-emerald-500/20",label: "Auto-renews if ignored"       },
          ].map(({ icon: Icon, color, bg, border, label }, i) => (
            <div key={i} className={`flex items-center gap-2 rounded-xl px-3 py-2.5 border ${bg} ${border}`}>
              <Icon className={`w-3 h-3 shrink-0 ${color}`} />
              <span className={`text-[10px] font-semibold ${color}`}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom gradient */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-slate-950/80 to-transparent pointer-events-none" />

      {/* Top left: branding */}
      <div className="absolute top-4 left-5 flex items-center gap-2 opacity-60">
        <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center">
          <FileText className="w-3.5 h-3.5 text-primary" />
        </div>
        <span className="text-white text-xs font-bold tracking-tight">PlainPath</span>
      </div>

      {/* Top right: duration badge — only shown when video is ready */}
      {hasVideo && (
        <div className="absolute top-4 right-5 px-2 py-1 rounded-md bg-black/60 text-white text-[11px] font-semibold opacity-75">
          2:18
        </div>
      )}

      {/* Center: play button (video ready) OR "Try it live" CTA (no video yet) */}
      <div className="absolute inset-0 flex items-center justify-center">
        {hasVideo ? (
          <motion.div
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            className="relative"
          >
            <div className="absolute inset-0 rounded-full bg-white/15 animate-ping scale-[1.6]" />
            <div className="relative w-[72px] h-[72px] rounded-full bg-white/95 shadow-[0_0_60px_rgba(255,255,255,0.25)] flex items-center justify-center">
              <Play className="w-7 h-7 text-slate-900 fill-slate-900 ml-1" />
            </div>
          </motion.div>
        ) : (
          <motion.div
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="px-6 py-3 rounded-2xl bg-white/95 shadow-[0_0_40px_rgba(255,255,255,0.20)] flex items-center gap-2.5">
              <Play className="w-4 h-4 text-slate-700 fill-slate-700 shrink-0" />
              <span className="text-slate-900 font-semibold text-sm">Try it yourself</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/50 text-[11px]">
              <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
              <span>Interactive demos below</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Bottom badge */}
      <div className="absolute bottom-5 inset-x-0 flex justify-center">
        {hasVideo ? (
          <span className="px-3.5 py-1.5 rounded-full bg-black/55 backdrop-blur-sm text-white text-[11px] font-medium flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />
            AI narrated walkthrough · 2 min 18 sec
          </span>
        ) : (
          <span className="px-3.5 py-1.5 rounded-full bg-black/55 backdrop-blur-sm text-white/70 text-[11px] font-medium flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80 shrink-0" />
            Walkthrough video coming soon
          </span>
        )}
      </div>
    </div>
  )
}

/* ── Embedded video — supports YouTube iframe OR native MP4/WebM ── */
function VideoEmbed({ onClose }: { onClose: () => void }) {
  const isYouTube = DEMO_VIDEO_URL.includes("youtube.com") || DEMO_VIDEO_URL.includes("youtu.be")

  return (
    <div className="relative w-full aspect-video bg-slate-950">
      {isYouTube ? (
        <iframe
          className="w-full h-full"
          src={`${DEMO_VIDEO_URL}?autoplay=1&rel=0&modestbranding=1`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="PlainPath demo walkthrough"
        />
      ) : (
        <video
          className="w-full h-full object-cover"
          src={DEMO_VIDEO_URL}
          autoPlay
          controls
          playsInline
          title="PlainPath demo walkthrough"
        />
      )}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors z-10"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

/* ── Main component ── */
export default function VideoWalkthrough() {
  const [playing, setPlaying] = useState(false)
  const [activeChapter, setActiveChapter] = useState(0)
  const hasVideo = Boolean(DEMO_VIDEO_URL)

  function handlePlay() {
    if (hasVideo) {
      setPlaying(true)
    } else {
      document.getElementById("demos")?.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <div className="w-full">
      {/* Section header */}
      <div className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/15 border border-primary/30 mb-5"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Product walkthrough</span>
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-5xl font-display font-bold mb-4 text-white"
        >
          See PlainPath in action
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed"
        >
          Four tools. One workflow. From uploading a confusing document to reviewing a contract — see exactly what PlainPath does.
        </motion.p>
      </div>

      {/* Player card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
        className="max-w-4xl mx-auto"
      >
        {/* Video frame */}
        <div className="rounded-2xl overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.35)] ring-1 ring-white/12 outline outline-1 outline-white/5">
          <AnimatePresence mode="wait">
            {playing && DEMO_VIDEO_URL ? (
              <motion.div
                key="video"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <VideoEmbed onClose={() => setPlaying(false)} />
              </motion.div>
            ) : (
              <motion.div
                key="thumb"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ThumbnailPreview onPlay={handlePlay} hasVideo={hasVideo} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Chapter markers */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {CHAPTERS.map((ch) => {
            const Icon = ch.icon
            const isActive = activeChapter === ch.id
            return (
              <motion.button
                key={ch.id}
                onClick={() => setActiveChapter(ch.id)}
                whileHover={{ y: -2 }}
                className={[
                  "text-left px-4 py-3.5 rounded-xl border transition-all",
                  isActive
                    ? `${ch.activeBg} ${ch.activeBorder} shadow-md`
                    : "bg-white/6 border-white/10 hover:bg-white/10 hover:border-white/20",
                ].join(" ")}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg ${ch.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon className={`w-4 h-4 ${ch.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white mb-0.5 truncate">{ch.label}</p>
                    <p className="text-[11px] text-slate-400 leading-snug">{ch.desc}</p>
                    <p className="text-[10px] text-slate-500 mt-1 font-mono">{ch.time} · {ch.duration}</p>
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
