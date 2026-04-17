import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useThemeContext } from "@/components/ThemeProvider";
import { Moon, Sun, Menu, X } from "lucide-react";

function smoothScroll(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth" });
}

const NAV_LINKS = [
  { label: "Features",     target: "features"     },
  { label: "How it works", target: "how-it-works" },
  { label: "Pricing",      target: "pricing"      },
];

const LOGO_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-white">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

export function Navbar() {
  const { isDark, setTheme } = useThemeContext();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

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

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
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
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors border-0 bg-transparent cursor-pointer"
          >
            {isDark
              ? <Sun className="w-4 h-4" />
              : <Moon className="w-4 h-4" />
            }
          </button>

          <a
            href="/app/analyze"
            className="hidden md:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2"
          >
            Log in
          </a>

          <Button
            className="rounded-full px-5 font-medium shadow-sm hidden md:flex"
            onClick={() => handleNav("download")}
          >
            Get the App
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

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden bg-background border-b border-border/50 px-5 pt-2 pb-5 space-y-1">
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
              href="/app/analyze"
              className="block px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-secondary/60 transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Log in to Web App
            </a>
            <Button
              className="w-full rounded-xl font-medium"
              onClick={() => handleNav("download")}
            >
              Get the App
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
