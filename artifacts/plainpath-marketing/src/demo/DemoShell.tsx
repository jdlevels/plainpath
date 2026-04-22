import { ReactNode } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, ArrowRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

interface DemoShellProps {
  children: ReactNode;
  toolName: string;
  subtitle: string;
  scenarioLabel: string;
}

export function DemoShell({ children, toolName, subtitle, scenarioLabel }: DemoShellProps) {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Demo mode banner */}
      <div className="mt-16 w-full bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-medium text-amber-800 dark:text-amber-300">
            <Eye className="w-3.5 h-3.5 shrink-0" />
            <span>
              <span className="font-semibold">Demo mode</span>
              <span className="hidden sm:inline"> · Sample scenario · Read-only preview</span>
            </span>
            <span className="hidden md:inline text-amber-600 dark:text-amber-400">— {scenarioLabel}</span>
          </div>
          <button
            onClick={() => navigate("/demo")}
            className="text-xs text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 font-medium flex items-center gap-1 transition-colors shrink-0"
          >
            <ArrowLeft className="w-3 h-3" />
            All demos
          </button>
        </div>
      </div>

      {/* Page header */}
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 pt-10 pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1.5" style={{ fontFamily: "var(--font-display)" }}>
          {toolName}
        </h1>
        <p className="text-muted-foreground text-base">{subtitle}</p>
      </div>

      {/* Main content */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 pb-12">
        {children}
      </div>

      {/* CTA footer */}
      <div className="w-full bg-gradient-to-br from-indigo-50 via-blue-50 to-violet-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 border-t border-border/60 py-14 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-3 text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            Ready to use your own documents?
          </h2>
          <p className="text-muted-foreground mb-7">
            Start free — upload any PDF and get plain-English results in under 2 minutes. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="rounded-full px-8 font-semibold gap-2 shadow-md">
              <a href="/app/sign-up">
                Start free
                <ArrowRight className="w-4 h-4" />
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full px-8 font-medium">
              <a href="/#pricing">See pricing</a>
            </Button>
          </div>
          <button
            onClick={() => navigate("/demo")}
            className="mt-5 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 mx-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to all demos
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
