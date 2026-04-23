import { useEffect, useMemo } from "react"
import { useLocation } from "wouter"
import { UserProfile } from "@clerk/react"
import { useTheme } from "@/hooks/useTheme"
import { ArrowLeft, ShieldCheck } from "lucide-react"

export default function AccountSecurity() {
  const [, setLocation] = useLocation()
  const { theme } = useTheme()
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)

  useEffect(() => {
    document.title = "Account & Security — PlainPath"
    return () => { document.title = "PlainPath" }
  }, [])

  const appearance = useMemo(() => ({
    variables: {
      colorPrimary: isDark ? "#818cf8" : "#4f46e5",
      colorBackground: isDark ? "hsl(222 14% 9%)" : "hsl(0 0% 100%)",
      colorText: isDark ? "hsl(210 40% 98%)" : "hsl(222 47% 11%)",
      colorTextSecondary: isDark ? "hsl(215 20% 60%)" : "hsl(215 20% 45%)",
      colorInputBackground: isDark ? "hsl(222 14% 12%)" : "hsl(0 0% 100%)",
      colorInputText: isDark ? "hsl(210 40% 98%)" : "hsl(222 47% 11%)",
      colorNeutral: isDark ? "hsl(215 20% 60%)" : "hsl(215 20% 45%)",
      borderRadius: "0.75rem",
      fontFamily: "inherit",
      fontSize: "0.9rem",
    },
    elements: {
      rootBox: "w-full",
      card: "w-full shadow-none border-0 bg-transparent",
      navbar: "border-r border-border/40 bg-background",
      navbarButton: "text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors",
      navbarButton__active: "text-primary bg-primary/8 font-semibold rounded-lg",
      navbarMobileMenuButton: "text-muted-foreground",
      pageScrollBox: "px-0 pt-0",
      headerTitle: "text-foreground font-bold text-lg",
      headerSubtitle: "text-muted-foreground text-sm",
      profileSectionTitle: "text-foreground font-semibold border-b border-border/40 pb-2 mb-3",
      profileSectionContent: "text-muted-foreground",
      profileSectionPrimaryButton: "text-primary hover:text-primary/80 font-medium text-sm",
      formFieldLabel: "text-foreground text-sm font-medium mb-1",
      formFieldInput:
        "bg-background border border-border text-foreground placeholder:text-muted-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40",
      formButtonPrimary:
        "bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg px-4 py-2 text-sm",
      formButtonReset: "text-muted-foreground hover:text-foreground text-sm",
      formResendCodeLink: "text-primary hover:text-primary/80",
      accordionTriggerButton: "text-foreground font-medium",
      badge: "hidden",
      dangerSection: "hidden",
      profilePage__security: "",
    },
  }), [isDark])

  return (
    <div className="min-h-[calc(100vh-4rem)]">

      {/* Sticky command bar */}
      <div className="sticky top-16 z-20 border-b border-border/70 bg-background/98 backdrop-blur-sm shadow-sm">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-3">
          <button
            onClick={() => setLocation("/")}
            className="shrink-0 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground leading-tight">Account &amp; Security</p>
              <p className="text-[11px] text-muted-foreground leading-none font-medium">Password, profile &amp; security settings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-24">
        <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm">
          <UserProfile appearance={appearance} />
        </div>
      </div>
    </div>
  )
}
