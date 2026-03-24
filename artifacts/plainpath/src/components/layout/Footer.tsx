import { FileText } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-white border-t border-border mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-50 grayscale">
            <FileText className="w-5 h-5" />
            <span className="font-display font-bold text-lg tracking-tight">PlainPath</span>
          </div>
          <p className="text-sm text-muted-foreground text-center md:text-right">
            Making paperwork clear, actionable, and less stressful.
          </p>
        </div>
      </div>
    </footer>
  )
}
