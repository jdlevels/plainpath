import { useState, useRef, useEffect } from "react"
import { Link, useLocation } from "wouter"
import { Button } from "@/components/ui/button"
import { FileText, ArrowRight, Plus, BookMarked, GitCompare, LogOut, User, ChevronDown } from "lucide-react"
import { ThemeToggle } from "@/components/ui/ThemeToggle"
import { useUser, useClerk } from "@clerk/react"

function UserMenu() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  const displayName = user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] || "Account"
  const initials = (user?.firstName?.[0] || "") + (user?.lastName?.[0] || "")

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        aria-label="Account menu"
      >
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs select-none">
          {initials ? initials.toUpperCase() : <User className="w-3.5 h-3.5" />}
        </div>
        <span className="hidden sm:inline max-w-[120px] truncate">{displayName}</span>
        <ChevronDown className="w-3.5 h-3.5 opacity-60" />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-52 rounded-xl border border-border/60 bg-background shadow-lg z-50 py-1 overflow-hidden">
          <div className="px-3 py-2 border-b border-border/40">
            <p className="text-xs font-medium text-foreground truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.emailAddresses?.[0]?.emailAddress}</p>
          </div>
          <button
            onClick={() => { setOpen(false); signOut({ redirectUrl: "/" }) }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

export function Navbar() {
  const [location, navigate] = useLocation()
  const { isSignedIn, isLoaded } = useUser()
  const isHome = location === "/"
  const isImport = location === "/import"
  const isAnalyze = location.startsWith("/analyze")
  const isMyAnalyses = location === "/my-analyses"
  const isContractBuilder = location === "/contract-builder"
  const isContractReview = location === "/contract-review"
  const isTrustCheck = location === "/trust-check"
  const isStaticPage = location === "/privacy" || location === "/terms" || location === "/subscribe" || location === "/subscribe/success" || location === "/subscribe/cancel"

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-background/90 border-b border-border/50 transition-all duration-300 safe-top">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <button
          onClick={() => {
            navigate("/")
            window.scrollTo({ top: 0, behavior: "smooth" })
          }}
          aria-label="PlainPath — go to home"
          className="flex items-center gap-2 group cursor-pointer rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
        >
          <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
            <FileText className="w-5 h-5 text-primary" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-foreground group-hover:text-primary transition-colors">
            PlainPath
          </span>
        </button>

        <nav className="flex items-center gap-1.5">
          <ThemeToggle />

          {/* Anchor nav — home page only, desktop */}
          {isHome && (
            <>
              <a href="#solutions" className="hidden md:inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-lg hover:bg-secondary">
                Solutions
              </a>
              <a href="#how-it-works" className="hidden md:inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-lg hover:bg-secondary">
                How it works
              </a>
              <a href="#pricing" className="hidden md:inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                View Pricing
              </a>
            </>
          )}

          {/* My Analyses link — visible when not on home or My Analyses page */}
          {!isHome && !isMyAnalyses && (
            <Link
              href="/my-analyses"
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-lg hover:bg-secondary"
            >
              <BookMarked className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">My Analyses</span>
            </Link>
          )}

          {/* Compare link — visible on non-home pages, not on Compare page itself */}
          {!isHome && location !== "/compare" && (
            <Link
              href="/compare"
              className="hidden md:flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-lg hover:bg-secondary"
            >
              <GitCompare className="w-3.5 h-3.5" />
              Compare
            </Link>
          )}

          {/* When on Contract Builder page, show Home link */}
          {(isContractBuilder || isContractReview) && (
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-lg hover:bg-secondary ml-1"
            >
              Home
            </Link>
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

          {(isImport || isMyAnalyses || isStaticPage || isTrustCheck) && (
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

          {/* Auth — sign in button or user menu */}
          {isLoaded && (
            isSignedIn
              ? <UserMenu />
              : (
                <Link
                  href="/sign-in"
                  className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-lg hover:bg-secondary ml-1 border border-border/50"
                >
                  Sign in
                </Link>
              )
          )}
        </nav>
      </div>
    </header>
  )
}
