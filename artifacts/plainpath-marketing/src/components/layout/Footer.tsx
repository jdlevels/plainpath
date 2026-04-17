function smoothScroll(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth" });
}

const LOGO_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-white">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

export function Footer() {
  return (
    <footer className="bg-background border-t border-border pt-14 pb-8">
      <div className="max-w-7xl mx-auto px-5 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 mb-14">

          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
                {LOGO_SVG}
              </div>
              <span className="font-display font-bold text-xl tracking-tight text-foreground">PlainPath</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mb-3">
              Plain-English help for confusing paperwork.
            </p>
            <a
              href="mailto:support@plainpathapp.com"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              support@plainpathapp.com
            </a>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-foreground">Product</h4>
            <ul className="space-y-3">
              <li>
                <button
                  onClick={() => smoothScroll("features")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors bg-transparent border-0 cursor-pointer p-0"
                >
                  Features
                </button>
              </li>
              <li>
                <button
                  onClick={() => smoothScroll("pricing")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors bg-transparent border-0 cursor-pointer p-0"
                >
                  Pricing
                </button>
              </li>
              <li><a href="/app/analyze" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Web App</a></li>
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
              <li><a href="/app/support" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Support</a></li>
              <li><a href="/app/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a></li>
              <li><a href="/app/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} PlainPath. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <a href="/app/privacy" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="/app/terms" className="hover:text-foreground transition-colors">Terms of Service</a>
            <a href="/app/support" className="hover:text-foreground transition-colors">Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
