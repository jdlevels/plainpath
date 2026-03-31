import { Link, useLocation } from "wouter"
import { Button } from "@/components/ui/button"
import { FileText, ArrowRight, Plus, BookMarked } from "lucide-react"
import { ThemeToggle } from "@/components/ui/ThemeToggle"

export function Navbar() {
  const [location] = useLocation()
  const isHome = location === "/"
  const isImport = location === "/import"
  const isAnalyze = location.startsWith("/analyze")
  const isMyAnalyses = location === "/my-analyses"
  const isStaticPage = location === "/privacy" || location === "/terms" || location === "/subscribe" || location === "/subscribe/success"

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-background/90 border-b border-border/50 transition-all duration-300 safe-top">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group outline-none">
          <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
            <FileText className="w-5 h-5 text-primary" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-foreground">
            PlainPath
          </span>
        </Link>

        <nav className="flex items-center gap-1.5">
          <ThemeToggle />

          {/* My Analyses link — always visible except on the My Analyses page itself */}
          {!isMyAnalyses && (
            <Link
              href="/my-analyses"
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-lg hover:bg-secondary"
            >
              <BookMarked className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">My Analyses</span>
            </Link>
          )}

          {isHome && (
            <a
              href="#pricing"
              className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              View Pricing
            </a>
          )}

          {isHome && (
            <Button asChild size="sm" className="rounded-full shadow-sm hover:shadow-md gap-1.5 ml-1" style={{ touchAction: "manipulation" }}>
              <Link href="/import">
                <span className="sm:hidden">Analyze</span>
                <span className="hidden sm:inline">Analyze a Document</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          )}

          {(isImport || isMyAnalyses || isStaticPage) && (
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-lg hover:bg-secondary ml-1"
            >
              Home
            </Link>
          )}

          {isAnalyze && (
            <Button asChild size="sm" variant="outline" className="rounded-full gap-1.5 bg-card border-border/60 text-sm ml-1">
              <Link href="/import">
                <Plus className="w-3.5 h-3.5" /> New Analysis
              </Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  )
}
