import { Star } from "lucide-react"

const FooterLogo = () => (
  <div className="flex items-center gap-2.5 mb-4">
    {/* Transparent icon mark — works on both light and dark footer surfaces */}
    <img
      src="/images/logo-icon.png"
      alt=""
      aria-hidden="true"
      className="h-9 w-9 shrink-0 object-contain"
      draggable={false}
    />
    <span
      className="font-display font-bold text-xl tracking-tight text-foreground"
      style={{ fontFamily: "var(--font-display)" }}
    >
      PlainPath
    </span>
  </div>
);

export function Footer() {
  return (
    <footer className="bg-background border-t border-border pt-14 pb-8">
      <div className="max-w-6xl mx-auto px-5 sm:px-6">

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 mb-14">

          {/* Brand */}
          <div className="col-span-2">
            <FooterLogo />
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mb-3">
              Plain-English help for confusing paperwork.
            </p>
            <a
              href="mailto:support@plainpathapp.com"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              support@plainpathapp.com
            </a>

            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-200/70 dark:border-red-800/50 bg-red-50/80 dark:bg-red-950/20">
              <Star className="w-3.5 h-3.5 text-amber-500" style={{ fill: "#f59e0b" }} />
              <span className="text-xs font-semibold text-red-700 dark:text-red-400">Veteran-Owned Business</span>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-foreground">Product</h4>
            <ul className="space-y-3">
              <li><a href="/#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a></li>
              <li><a href="/#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a></li>
              <li><a href="/app/sign-in" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Web App</a></li>
            </ul>
          </div>

          {/* Guides */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-foreground">Guides</h4>
            <ul className="space-y-3">
              <li><a href="/guides/reviewing-a-lease" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Reviewing a Lease</a></li>
              <li><a href="/guides/understanding-an-nda" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Understanding an NDA</a></li>
              <li><a href="/guides/employment-contract-red-flags" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Employment Contracts</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-foreground">Company</h4>
            <ul className="space-y-3">
              <li><a href="/support" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Support</a></li>
              <li><a href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a></li>
              <li><a href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            © {new Date().getFullYear()} PlainPath. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground text-center sm:text-right max-w-sm">
            PlainPath provides document insights and does not replace legal advice.
          </p>
        </div>

      </div>
    </footer>
  );
}
