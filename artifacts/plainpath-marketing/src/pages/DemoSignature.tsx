import { motion } from "framer-motion";
import { FileSignature, CheckCircle2, Clock, Mail, User, Send, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DemoShell } from "@/demo/DemoShell";

const SIGNERS = [
  {
    name: "Alex Rivera",
    email: "alex@meridianroasters.com",
    role: "Client (Meridian Coffee Roasters, LLC)",
    status: "signed",
    date: "April 18, 2025",
    time: "2:34 PM",
  },
  {
    name: "Jordan Kim",
    email: "jordan@yourdesignco.com",
    role: "Contractor (Your Design Co.)",
    status: "pending",
    date: null,
    time: null,
  },
];

const TIMELINE = [
  { date: "April 18, 2025", time: "10:12 AM", event: "Envelope created and sent to both signers", icon: Send, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-950/40" },
  { date: "April 18, 2025", time: "2:34 PM", event: "Alex Rivera (Client) signed — signature captured", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-100 dark:bg-emerald-950/40" },
  { date: "Pending", time: null, event: "Awaiting Jordan Kim (Contractor) to sign", icon: Clock, color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-950/40" },
];

function SignatureMockup() {
  return (
    <div className="rounded-xl border border-border bg-white dark:bg-slate-900 p-5 shadow-sm text-xs font-mono space-y-2">
      <p className="font-bold text-sm text-center text-foreground font-sans mb-4">Freelance Services Agreement</p>

      <p className="text-muted-foreground">This agreement is entered into as of <span className="text-foreground">April 15, 2025</span></p>
      <p className="text-muted-foreground">between <span className="text-foreground font-semibold">Meridian Coffee Roasters, LLC</span> ("Client")</p>
      <p className="text-muted-foreground">and <span className="text-foreground font-semibold">Jordan Kim / Your Design Co.</span> ("Contractor").</p>

      <div className="border-t border-border/50 pt-3 mt-3">
        <p className="text-muted-foreground text-[10px]">SECTION 1 — SERVICES</p>
        <p className="text-muted-foreground">Contractor shall provide full website redesign services...</p>
      </div>

      <div className="border-t border-border/50 pt-3 mt-3">
        <p className="text-muted-foreground text-[10px]">SECTION 2 — PAYMENT</p>
        <p className="text-muted-foreground">Total fee: <span className="text-foreground">$4,800.00</span>...</p>
      </div>

      {/* Signature block */}
      <div className="border-t-2 border-border mt-4 pt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] text-muted-foreground mb-2">CLIENT SIGNATURE</p>
          <div className="border-b border-border pb-1 mb-1">
            <p className="font-sans italic text-lg text-emerald-600 dark:text-emerald-400" style={{ fontFamily: "cursive" }}>Alex Rivera</p>
          </div>
          <p className="text-[10px] text-muted-foreground">Alex Rivera · April 18, 2025</p>
          <div className="flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
            <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">Signed · 2:34 PM</p>
          </div>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground mb-2">CONTRACTOR SIGNATURE</p>
          <div className="border-b border-dashed border-border/60 pb-1 mb-1">
            <p className="text-[10px] text-muted-foreground italic py-2">Signature pending…</p>
          </div>
          <p className="text-[10px] text-muted-foreground">Jordan Kim · Awaiting</p>
          <div className="flex items-center gap-1 mt-1">
            <Clock className="w-2.5 h-2.5 text-amber-500" />
            <p className="text-[9px] text-amber-600 dark:text-amber-400 font-semibold">Not yet signed</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DemoSignature() {
  return (
    <DemoShell
      toolName="Digital Signature"
      subtitle="Send documents for legally binding electronic signature — track status, see who's signed, and get notified when complete."
      scenarioLabel="Freelance Services Agreement · 2 signers · 1 of 2 signed"
    >
      {/* Status banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/15 mb-6"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-indigo-100 dark:bg-indigo-950/50 p-3 shrink-0">
            <FileSignature className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Freelance_Services_Agreement_Meridian.pdf</p>
            <p className="text-xs text-muted-foreground">Created by Demo User · April 18, 2025 · 10:12 AM</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
          <Badge className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-300">1 signed</Badge>
          <Badge className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-300">1 pending</Badge>
          <Badge variant="outline" className="text-[10px]">In progress</Badge>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Document preview + signers */}
        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">Document preview</p>
            </div>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <SignatureMockup />
            </motion.div>
          </div>

          {/* Signers */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">Signers ({SIGNERS.length})</p>
            </div>
            <div className="space-y-3">
              {SIGNERS.map((signer, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.08 }}
                  className={`rounded-xl border p-4 flex items-start gap-3 ${signer.status === "signed"
                    ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/15"
                    : "border-amber-200 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/15"
                  }`}
                >
                  <div className={`rounded-full p-1.5 shrink-0 ${signer.status === "signed" ? "bg-emerald-100 dark:bg-emerald-950/50" : "bg-amber-100 dark:bg-amber-950/50"}`}>
                    {signer.status === "signed"
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      : <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{signer.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground truncate">{signer.email}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{signer.role}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    {signer.status === "signed" ? (
                      <>
                        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Signed</p>
                        <p className="text-[10px] text-muted-foreground">{signer.time}</p>
                      </>
                    ) : (
                      <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">Pending</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Timeline */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">Signing timeline</p>
          </div>
          <div className="relative pl-6">
            {/* Vertical line */}
            <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-border/60 rounded-full" />

            <div className="space-y-6">
              {TIMELINE.map((event, i) => {
                const Icon = event.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.12 }}
                    className="relative flex items-start gap-3"
                  >
                    <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full ${event.bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-2.5 h-2.5 ${event.color}`} />
                    </div>
                    <div>
                      <p className="text-sm text-foreground leading-snug">{event.event}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {event.date}{event.time ? ` · ${event.time}` : ""}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="mt-8 rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-semibold text-foreground mb-2">What happens next?</p>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li className="flex items-start gap-2"><span className="text-primary shrink-0">·</span> Jordan Kim receives a signing link by email</li>
              <li className="flex items-start gap-2"><span className="text-primary shrink-0">·</span> When Jordan signs, both parties receive a fully executed PDF</li>
              <li className="flex items-start gap-2"><span className="text-primary shrink-0">·</span> The signed copy is stored in your PlainPath document library</li>
              <li className="flex items-start gap-2"><span className="text-primary shrink-0">·</span> You can send a reminder or download a partial copy at any time</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </DemoShell>
  );
}
