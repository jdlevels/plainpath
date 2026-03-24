import { Link, useLocation } from "wouter"
import { Button } from "@/components/ui/button"
import { FileText, ArrowRight } from "lucide-react"

export function Navbar() {
  const [location] = useLocation();
  const isHome = location === "/";

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-background/80 border-b border-border/50 transition-all duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group outline-none">
          <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
            <FileText className="w-5 h-5 text-primary" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-foreground">
            PlainPath
          </span>
        </Link>
        
        <nav className="flex items-center gap-4">
          {!isHome && (
            <Link href="/import" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              New Analysis
            </Link>
          )}
          <Button asChild size="sm" className="rounded-full shadow-sm hover:shadow-md">
            <Link href="/import" className="gap-1.5">
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}
