import { useState, useRef, useEffect } from "react"
import { Link, useLocation } from "wouter"
import { Button } from "@/components/ui/button"
import {
  FileScan, Plus, BookMarked, GitCompare, LogOut, User, ChevronDown,
  LayoutGrid, ShieldCheck, PenLine, Scale, Menu, X, LayoutDashboard, CreditCard, EyeOff, FolderOpen, ListChecks, LayoutTemplate, MessageCircle,
} from "lucide-react"

import { ThemeToggle } from "@/components/ui/ThemeToggle"
import { useUser, useClerk } from "@clerk/react"
import { useEntitlements } from "@/hooks/useEntitlements"
import { BUILDER_ENABLED } from "@/lib/builderConfig"
import { WhatsNew } from "@/components/WhatsNew"

function LogoBrand() {
  return (
    <div className="flex items-center gap-2">
      <img
        src="/images/logo-icon.png"
        alt=""
        aria-hidden="true"
        className="h-8 w-8 shrink-0 object-contain"
        draggable={false}
      />
      <span
        className="font-display font-bold text-[1.2rem] leading-none tracking-tight text-foreground"
        style={{ fontFamily: "var(--font-display)" }}
      >
        PlainPath
      </span>
    </div>
  )
}

const TOOL_NAV = [
  { label: "Analyze a Document",    href: "/analyze",                 icon: FileScan      },
  { label: "Document Trust Check",  href: "/import?mode=trust-check", icon: ShieldCheck   },
  { label: "Contract Review",       href: "/contract-review",         icon: Scale         },
  { label: "Build a Contract",      href: "/build-contract",          icon: PenLine       },
  { label: "Redact Sensitive Info", href: "/redact",                  icon: EyeOff        },
  { label: "Clause Extractor",       href: "/clause-extractor",        icon: ListChecks    },
  { label: "Compare Versions",      href: "/compare-versions",        icon: GitCompare    },
]

function UserMenu() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const { isAdmin } = useEntitlements()
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
        <div className="relative w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs select-none">
          {initials ? initials.toUpperCase() : <User className="w-3.5 h-3.5" />}
          {isAdmin && (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 border border-background" title="Admin" />
          )}
        </div>
        <span className="hidden sm:inline max-w-[120px] truncate">{displayName}</span>
        <ChevronDown className="w-3.5 h-3.5 opacity-60" />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-56 rounded-xl border border-border/60 bg-background shadow-lg z-50 py-1 overflow-hidden">

          {/* Identity header */}
          <div className="px-3 py-2.5 border-b border-border/40">
            <div className="flex items-center gap-1.5 mb-0.5">
              <p className="text-xs font-semibold text-foreground truncate">{displayName}</p>
              {isAdmin && (
                <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 leading-none">
                  Admin
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">{user?.emailAddresses?.[0]?.emailAddress}</p>
          </div>

          {/* Account & Security */}
          <Link
            href="/account-security"
            onClick={() => setOpen(false)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Account &amp; Security
          </Link>

          {/* Plan & Billing */}
          <Link
            href="/billing"
            onClick={() => setOpen(false)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <CreditCard className="w-3.5 h-3.5" />
            Plan &amp; Billing
          </Link>

          {/* Support */}
          <Link
            href="/support"
            onClick={() => setOpen(false)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Support
          </Link>

          {/* Divider + Sign out */}
          <div className="border-t border-border/40 mt-1 pt-1">
            <button
              onClick={async () => { setOpen(false); await signOut(); window.location.href = "/"; }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
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
  const isDocuments = location === "/documents"
  const isBuilder = location.startsWith("/builder")

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

        {/* Logo → dashboard home */}
        <a
          href="/app/"
          aria-label="PlainPath — go to dashboard"
          className="flex items-center shrink-0 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
        >
          <LogoBrand />
        </a>

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
                </div>
            )}
          </div>

            {/* Document Builder */}
          {BUILDER_ENABLED && (
            <Link
              href="/builder"
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors px-2.5 py-1.5 rounded-lg ${
                isBuilder
                  ? "text-primary bg-primary/8"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <LayoutTemplate className="w-3.5 h-3.5" />
              Document Builder
            </Link>
          )}

          {/* My Documents */}
          <Link
            href="/documents"
            className={`flex items-center gap-1.5 text-sm font-medium transition-colors px-2.5 py-1.5 rounded-lg ${
              isDocuments
                ? "text-primary bg-primary/8"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            My Documents
          </Link>

          {/* My Analyses */}
          <Link
            href="/my-analyses"
            className={`flex items-center gap-1.5 text-sm font-medium transition-colors px-2.5 py-1.5 rounded-lg ${
              isMyAnalyses
                ? "text-primary bg-primary/8"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <BookMarked className="w-3.5 h-3.5" />
            My Analyses
          </Link>

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
          <WhatsNew />
          <ThemeToggle />

          <a
            href="/"
            className="hidden md:flex items-center gap-1 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors px-2 py-1.5 rounded-lg"
          >
            <LayoutDashboard className="w-3 h-3" />
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
            <div className="border-t border-border/30 mt-2 pt-2">
              {BUILDER_ENABLED && (
                <button
                  onClick={() => navigate("/builder")}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-sm rounded-lg transition-colors text-left ${
                    isBuilder ? "text-primary bg-primary/8 font-medium" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <LayoutTemplate className="w-4 h-4 shrink-0" />
                  Document Builder
                </button>
              )}
              <button
                onClick={() => navigate("/documents")}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-sm rounded-lg transition-colors text-left ${
                  isDocuments ? "text-primary bg-primary/8 font-medium" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <FolderOpen className="w-4 h-4 shrink-0" />
                My Documents
              </button>
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
                className="w-full flex items-center gap-2.5 px-2.5 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                Website
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
