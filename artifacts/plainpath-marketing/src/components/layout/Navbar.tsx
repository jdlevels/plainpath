import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  Menu, X, ChevronDown,
  FileScan, ShieldCheck, Scale, PenLine, LayoutGrid, EyeOff,
  GitCompare, ListChecks, MessageCircle,
} from "lucide-react";

function smoothScroll(id: string) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth" });
  } else {
    window.location.href = `/#${id}`;
  }
}

const NAV_LINKS = [
  { label: "Features",     target: "features"     },
  { label: "How it works", target: "how-it-works" },
  { label: "Pricing",      target: "pricing"      },
];

const TOOL_LINKS = [
  { label: "Analyze a Document",    href: "/app/analyze",                 icon: FileScan       },
  { label: "Document Trust Check",  href: "/app/import?mode=trust-check", icon: ShieldCheck    },
  { label: "Contract Review",       href: "/app/contract-review",         icon: Scale          },
  { label: "Build a Contract",      href: "/app/build-contract",          icon: PenLine        },
  { label: "Redact Sensitive Info", href: "/app/redact",                  icon: EyeOff         },
  { label: "Compare Versions",      href: "/app/compare-versions",        icon: GitCompare     },
  { label: "Clause Extractor",       href: "/app/clause-extractor",        icon: ListChecks     },
  { label: "Ask This Document",      href: "/app/analyze",                 icon: MessageCircle  },
];

const LogoBrand = () => (
  <div className="flex items-center gap-2">
    {/* Transparent icon mark — works on both light and dark surfaces */}
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
          className="flex items-center shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-lg"
          aria-label="PlainPath — go to homepage"
        >
          <LogoBrand />
        </a>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-1">

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
            href="/support"
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
          >
            Support
          </a>
        </div>

        {/* Desktop actions */}
        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />

          <a
            href="/demo"
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-primary hover:bg-primary/8 transition-colors"
          >
            Try demo
          </a>

          <a
            href="/app/sign-in"
            className="hidden lg:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2"
          >
            Log in
          </a>

          <Button
            className="rounded-full px-5 font-medium shadow-sm hidden lg:flex"
            asChild
          >
            <a href="/app/analyze">Open App</a>
          </Button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(v => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors border-0 bg-transparent cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-background border-b border-border/50 px-5 pt-2 pb-5 space-y-1">

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
            href="/support"
            className="block px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            Support
          </a>

          <div className="pt-2 border-t border-border/40 mt-2 space-y-2">
            <a
              href="/demo"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-primary hover:bg-primary/8 transition-colors"
            >
              Try demo — no account needed
            </a>
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
              <a href="/app/analyze">Open App</a>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
