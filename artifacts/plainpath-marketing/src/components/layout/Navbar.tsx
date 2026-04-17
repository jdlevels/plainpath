import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  Menu, X, ChevronDown,
  FileText, ShieldCheck, Scale, PenLine, GitCompare, LayoutGrid,
} from "lucide-react";

function smoothScroll(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth" });
}

const NAV_LINKS = [
  { label: "Features",     target: "features"     },
  { label: "How it works", target: "how-it-works" },
  { label: "Pricing",      target: "pricing"      },
];

const TOOL_LINKS = [
  { label: "Analyze a Document",   href: "/app/analyze",         icon: FileText    },
  { label: "Document Trust Check", href: "/app/import?mode=trust-check", icon: ShieldCheck },
  { label: "Contract Review",      href: "/app/contract-review", icon: Scale       },
  { label: "Build a Contract",     href: "/app/build-contract",  icon: PenLine     },
  { label: "Compare Versions",     href: "/app/compare",         icon: GitCompare  },
];

const LOGO_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-white">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) setToolsOpen(false);
    }
    if (toolsOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [toolsOpen]);

  const handleNav = (target: string) => {
    smoothScroll(target);
    setMobileOpen(false);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${scrolled ? "bg-background/95 backdrop-blur-lg shadow-sm" : "bg-background/80 backdrop-blur-md"} border-b border-border/50`}>
      <div className="max-w-7xl mx-auto px-5 sm:px-6 h-16 flex items-center justify-between gap-4">

        {/* Logo → public homepage */}
        <a
          href="/"
          className="flex items-center gap-2 shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-lg"
          aria-label="PlainPath — go to homepage"
        >
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
            {LOGO_SVG}
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-foreground">PlainPath</span>
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">

          {/* Tools dropdown */}
          <div className="relative" ref={toolsRef}>
            <button
              onClick={() => setToolsOpen(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors bg-transparent border-0 cursor-pointer"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Tools
              <ChevronDown className={`w-3 h-3 opacity-60 transition-transform duration-150 ${toolsOpen ? "rotate-180" : ""}`} />
            </button>

            {toolsOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-56 rounded-xl border border-border/60 bg-background shadow-lg z-50 py-1 overflow-hidden">
                {TOOL_LINKS.map(({ label, href, icon: Icon }) => (
                  <a
                    key={href}
                    href={href}
                    onClick={() => setToolsOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    {label}
                  </a>
                ))}
              </div>
            )}
          </div>

          {NAV_LINKS.map(({ label, target }) => (
            <button
              key={target}
              onClick={() => handleNav(target)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors bg-transparent border-0 cursor-pointer"
            >
              {label}
            </button>
          ))}
          <a
            href="/app/support"
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
          >
            Support
          </a>
        </div>

        {/* Desktop actions */}
        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />

          <a
            href="/app/sign-in"
            className="hidden md:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2"
          >
            Log in
          </a>

          <Button
            className="rounded-full px-5 font-medium shadow-sm hidden md:flex"
            asChild
          >
            <a href="/app/analyze">Get the App</a>
          </Button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(v => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors border-0 bg-transparent cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-background border-b border-border/50 px-5 pt-2 pb-5 space-y-1">

          {/* Tools accordion */}
          <button
            onClick={() => setMobileToolsOpen(v => !v)}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors bg-transparent border-0 cursor-pointer text-left"
          >
            <LayoutGrid className="w-4 h-4" />
            Tools
            <ChevronDown className={`w-3.5 h-3.5 ml-auto opacity-60 transition-transform duration-150 ${mobileToolsOpen ? "rotate-180" : ""}`} />
          </button>

          {mobileToolsOpen && (
            <div className="ml-4 space-y-0.5 border-l border-border/40 pl-3">
              {TOOL_LINKS.map(({ label, href, icon: Icon }) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  {label}
                </a>
              ))}
            </div>
          )}

          {NAV_LINKS.map(({ label, target }) => (
            <button
              key={target}
              onClick={() => handleNav(target)}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors bg-transparent border-0 cursor-pointer"
            >
              {label}
            </button>
          ))}

          <a
            href="/app/support"
            className="block px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            Support
          </a>

          <div className="pt-2 border-t border-border/40 mt-2 space-y-2">
            <a
              href="/app/sign-in"
              className="block px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-secondary/60 transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Log in
            </a>
            <Button
              className="w-full rounded-xl font-medium"
              asChild
            >
              <a href="/app/analyze">Get the App</a>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
