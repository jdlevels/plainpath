import { useState, useRef, useEffect } from "react"
import { Link, useLocation } from "wouter"
import { Button } from "@/components/ui/button"
import {
  FileText, Plus, BookMarked, GitCompare, LogOut, User, ChevronDown,
  Users, LayoutGrid, ShieldCheck, PenLine, Scale, Menu, X, ExternalLink,
} from "lucide-react"
import { ThemeToggle } from "@/components/ui/ThemeToggle"
import { useUser, useClerk } from "@clerk/react"

const TOOL_NAV = [
  { label: "Analyze a Document",   href: "/analyze",         icon: FileText    },
  { label: "Document Trust Check", href: "/trust-check",     icon: ShieldCheck },
  { label: "Build a Contract",     href: "/build-contract",  icon: PenLine     },
  { label: "Contract Review",      href: "/contract-review", icon: Scale       },
]

function UserMenu() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
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
          <Link
            href="/team"
            onClick={() => setOpen(false)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <Users className="w-3.5 h-3.5" />
            Team
          </Link>
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
  const [toolsOpen, setToolsOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const toolsRef = useRef<HTMLDivElement>(null)

  const isResults = location.startsWith("/results")
  const isMyAnalyses = location === "/my-analyses"
  const isCompare = location === "/compare"

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) setToolsOpen(false)
    }
    if (toolsOpen) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [toolsOpen])

  useEffect(() => { setMobileOpen(false) }, [location])

  function isToolActive(href: string) {
    if (href === "/analyze") return location === "/analyze" || location === "/import" || location === "/results" || location.startsWith("/results")
    return location === href
  }

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-background/90 border-b border-border/50 transition-all duration-300 safe-top">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* Logo → internal app home */}
        <button
          onClick={() => navigate("/analyze")}
          aria-label="PlainPath — go to app home"
          className="flex items-center gap-2 group cursor-pointer rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
        >
          <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
            <FileText className="w-5 h-5 text-primary" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-foreground group-hover:text-primary transition-colors">
            PlainPath
          </span>
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5">

          {/* Tools dropdown */}
          <div className="relative" ref={toolsRef}>
            <button
              onClick={() => setToolsOpen((v) => !v)}
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-lg hover:bg-secondary"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Tools
              <ChevronDown className={`w-3 h-3 opacity-60 transition-transform ${toolsOpen ? "rotate-180" : ""}`} />
            </button>

            {toolsOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-56 rounded-xl border border-border/60 bg-background shadow-lg z-50 py-1 overflow-hidden">
                {TOOL_NAV.map(({ label, href, icon: Icon }) => (
                  <button
                    key={href}
                    onClick={() => { navigate(href); setToolsOpen(false) }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left ${
                      isToolActive(href)
                        ? "text-primary bg-primary/6 font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    {label}
                  </button>
                ))}
                <div className="border-t border-border/30 mt-1 pt-1">
                  <button
                    onClick={() => { navigate("/compare"); setToolsOpen(false) }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left ${
                      isCompare
                        ? "text-primary bg-primary/6 font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    <GitCompare className="w-3.5 h-3.5 shrink-0" />
                    Compare Documents
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* My Analyses */}
          {!isMyAnalyses && (
            <Link
              href="/my-analyses"
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-lg hover:bg-secondary"
            >
              <BookMarked className="w-3.5 h-3.5" />
              My Analyses
            </Link>
          )}

          {/* New Analysis — shown on results page */}
          {isResults && (
            <Button asChild size="sm" variant="outline" className="rounded-full gap-1.5 bg-card border-border/60 text-sm ml-1">
              <Link href="/analyze">
                <Plus className="w-3.5 h-3.5" /> New Analysis
              </Link>
            </Button>
          )}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-1.5">
          <ThemeToggle />

          <a
            href="/"
            className="hidden md:flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-lg hover:bg-secondary"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Website
          </a>

          {isLoaded && (
            isSignedIn
              ? <UserMenu />
              : (
                <Link
                  href="/sign-in"
                  className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-lg hover:bg-secondary border border-border/50"
                >
                  Sign in
                </Link>
              )
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          >
            {mobileOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/30 bg-background/98 backdrop-blur-lg">
          <div className="max-w-6xl mx-auto px-4 py-3 space-y-0.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 px-2 pt-1.5 pb-1">Tools</p>
            {TOOL_NAV.map(({ label, href, icon: Icon }) => (
              <button
                key={href}
                onClick={() => navigate(href)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-sm rounded-lg transition-colors text-left ${
                  isToolActive(href)
                    ? "text-primary bg-primary/8 font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </button>
            ))}
            <button
              onClick={() => navigate("/compare")}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-sm rounded-lg transition-colors text-left ${
                isCompare ? "text-primary bg-primary/8 font-medium" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <GitCompare className="w-4 h-4 shrink-0" />
              Compare Documents
            </button>

            <div className="border-t border-border/30 mt-2 pt-2">
              <button
                onClick={() => navigate("/my-analyses")}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-sm rounded-lg transition-colors text-left ${
                  isMyAnalyses ? "text-primary bg-primary/8 font-medium" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <BookMarked className="w-4 h-4 shrink-0" />
                My Analyses
              </button>
              <a
                href="/"
                className="flex items-center gap-2.5 px-2.5 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4 shrink-0" />
                Website
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
