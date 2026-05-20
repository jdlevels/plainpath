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

  // Dark mode colors are derived from the app's CSS variables:
  //   --background:       0 0% 9%   (near-black)
  //   --card:             0 0% 13%  (dark gray card surface)
  //   --foreground:       40 20% 97% (near-white)
  //   --muted-foreground: 0 0% 65%  (medium gray — secondary text)
  //   --border:           0 0% 20%  (subtle border)
  //
  // Clerk's `variables` drive inline styles on its internal elements.
  // Matching colorBackground to --card (not darker) prevents dark-on-dark.
  // colorTextSecondary at 68% lightness gives readable secondary labels.
  const appearance = useMemo(() => ({
    variables: {
      colorPrimary:         isDark ? "#818cf8" : "#4f46e5",
      // Match bg-card exactly so Clerk's sections sit ON the surface, not under it
      colorBackground:      isDark ? "hsl(0 0% 13%)"   : "hsl(0 0% 100%)",
      colorText:            isDark ? "hsl(40 20% 97%)"  : "hsl(0 0% 11%)",
      // 68% lightness gives clearly readable secondary labels on dark bg
      colorTextSecondary:   isDark ? "hsl(0 0% 68%)"   : "hsl(215 20% 45%)",
      // Input fields slightly lighter than the card surface
      colorInputBackground: isDark ? "hsl(0 0% 18%)"   : "hsl(0 0% 100%)",
      colorInputText:       isDark ? "hsl(40 20% 97%)"  : "hsl(0 0% 11%)",
      // Neutral drives borders/separators — match --border value
      colorNeutral:         isDark ? "hsl(0 0% 50%)"   : "hsl(215 20% 45%)",
      borderRadius: "0.75rem",
      fontFamily: "inherit",
      fontSize: "0.9rem",
    },
    elements: {
      rootBox: "w-full",
      // Transparent card — the outer container provides the bg-card surface
      card: "w-full shadow-none border-0 bg-transparent",

      // Sidebar / nav
      navbar: "border-r border-border/50 bg-transparent",
      // Inactive nav items: foreground at 75% opacity — clearly readable on dark bg
      navbarButton:
        "text-foreground/75 hover:text-foreground hover:bg-muted/70 rounded-lg transition-colors",
      // Active nav item: more opaque background, full-brightness text
      navbarButton__active:
        "text-primary bg-primary/15 font-semibold rounded-lg",
      navbarMobileMenuButton: "text-foreground/75",

      pageScrollBox: "px-0 pt-0",

      // Section headings and body
      headerTitle:           "text-foreground font-bold text-lg",
      headerSubtitle:        "text-foreground/65 text-sm",
      profileSectionTitle:
        "text-foreground font-semibold border-b border-border/50 pb-2 mb-3",
      // Use foreground/70 instead of muted-foreground — more legible on dark cards
      profileSectionContent: "text-foreground/70",
      profileSectionPrimaryButton:
        "text-primary hover:text-primary/80 font-medium text-sm",

      // Form elements
      formFieldLabel:
        "text-foreground text-sm font-medium mb-1",
      formFieldInput:
        "bg-background border border-border text-foreground placeholder:text-foreground/40 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40",
      formButtonPrimary:
        "bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg px-4 py-2 text-sm",
      formButtonReset:
        "text-foreground/60 hover:text-foreground text-sm",
      formResendCodeLink: "text-primary hover:text-primary/80",

      // Accordion (e.g. password change, active device details)
      accordionTriggerButton: "text-foreground font-medium",

      // Hide the Clerk beta badge — it's cosmetic clutter
      badge: "hidden",

      // Danger zone: show it, but keep it visually calm —
      // a subtle destructive tint without being alarming
      dangerSection:
        "border border-destructive/25 rounded-xl p-4 mt-4 bg-destructive/5",

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
