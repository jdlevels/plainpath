import { Link } from "wouter"
import { FileText, Lock, Shield } from "lucide-react"

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-card border-t border-border/50 mt-auto no-print safe-bottom">
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
            <p className="text-xs text-muted-foreground/60 max-w-xs leading-relaxed">
              Questions or feedback? <a href="mailto:hello@plainpath.app" className="text-muted-foreground/80 font-medium hover:text-foreground transition-colors">hello@plainpath.app</a>
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-secondary/40 border border-border/40">
                <Lock className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-xs font-medium text-foreground/70">PlainPath never stores your documents</span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-secondary/40 border border-border/40">
                <Shield className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-xs font-medium text-foreground/70">PlainPath reads only — never files or advises</span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground/50 leading-relaxed max-w-sm">
              Document text is processed by an AI service for analysis. No document data is retained by PlainPath between sessions.
            </p>
          </div>

        </div>

        <div className="mt-8 pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground/50">
            &copy; {year} PlainPath. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors">
              Terms of Use
            </Link>
            <Link href="/support" className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors">
              Support
            </Link>
            <span className="text-xs text-muted-foreground/40">Free to try · Plans from $4.99/month</span>
          </div>
        </div>

      </div>
    </footer>
  )
}
