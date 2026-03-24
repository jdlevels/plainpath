import { Link, useLocation } from "wouter"
import { Button } from "@/components/ui/button"
import { FileText, ArrowRight, Plus } from "lucide-react"

export function Navbar() {
  const [location] = useLocation()
  const isHome = location === "/"
  const isImport = location === "/import"
  const isAnalyze = location.startsWith("/analyze")
  const isStaticPage = location === "/privacy" || location === "/terms"

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-background/90 border-b border-border/50 transition-all duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group outline-none">
          <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
            <FileText className="w-5 h-5 text-primary" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-foreground">
            PlainPath
          </span>
        </Link>

        <nav className="flex items-center gap-3">
          {isHome && (
            <Button asChild size="sm" className="rounded-full shadow-sm hover:shadow-md gap-1.5">
              <Link href="/import">
                Analyze a Document <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          )}

          {isImport && (
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Home
            </Link>
          )}

          {isAnalyze && (
            <Button asChild size="sm" variant="outline" className="rounded-full gap-1.5 bg-white border-border/60 text-sm">
              <Link href="/import">
                <Plus className="w-3.5 h-3.5" /> New Analysis
              </Link>
            </Button>
          )}

          {isStaticPage && (
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Home
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
