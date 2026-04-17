import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useThemeContext } from "@/components/ThemeProvider";

export function Navbar() {
  const { isDark, setTheme } = useThemeContext()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="font-display font-bold text-xl tracking-tight">PlainPath</span>
        </div>
        
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
          <a href="/app/support" className="hover:text-foreground transition-colors">Support</a>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <a href="/app/" className="hidden md:block text-sm font-medium hover:text-foreground transition-colors">
            Log in to Web App
          </a>
          <Button asChild className="rounded-full px-6 font-medium shadow-sm">
            <a href="#download">Get the App</a>
          </Button>
        </div>
      </div>
    </nav>
  );
}
