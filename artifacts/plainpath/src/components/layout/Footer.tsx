import { FileText, Lock, Shield } from "lucide-react"

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-white border-t border-border/50 mt-auto no-print">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

        <div className="flex flex-col md:flex-row justify-between gap-8">

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" strokeWidth={2.5} />
              <span className="font-display font-bold text-base tracking-tight text-foreground">PlainPath</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Making paperwork clear, actionable, and less stressful.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-secondary/40 border border-border/40">
                <Lock className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-xs font-medium text-foreground/70">Your documents are never stored or shared</span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-secondary/40 border border-border/40">
                <Shield className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-xs font-medium text-foreground/70">PlainPath reads only — it never files or advises</span>
              </div>
            </div>
          </div>

        </div>

        <div className="mt-8 pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground/50">
            &copy; {year} PlainPath. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground/40 cursor-default hover:text-muted-foreground/60 transition-colors">Privacy</span>
            <span className="text-xs text-muted-foreground/40 cursor-default hover:text-muted-foreground/60 transition-colors">Terms</span>
            <span className="text-xs text-muted-foreground/40">Free to use · No account required</span>
          </div>
        </div>

      </div>
    </footer>
  )
}
