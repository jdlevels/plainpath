import { Button } from "@/components/ui/button";

function smoothScroll(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth" });
}

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex items-center gap-2 cursor-pointer bg-transparent border-0 p-0"
        >
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="font-display font-bold text-xl tracking-tight">PlainPath</span>
        </button>

        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <button
            onClick={() => smoothScroll("features")}
            className="hover:text-foreground transition-colors bg-transparent border-0 cursor-pointer p-0"
          >
            Features
          </button>
          <button
            onClick={() => smoothScroll("how-it-works")}
            className="hover:text-foreground transition-colors bg-transparent border-0 cursor-pointer p-0"
          >
            How it works
          </button>
          <a href="/app/support" className="hover:text-foreground transition-colors">Support</a>
        </div>

        <div className="flex items-center gap-4">
          <a href="/app/" className="hidden md:block text-sm font-medium hover:text-foreground transition-colors">
            Log in to Web App
          </a>
          <Button className="rounded-full px-6 font-medium shadow-sm" onClick={() => smoothScroll("download")}>
            Get the App
          </Button>
        </div>
      </div>
    </nav>
  );
}
