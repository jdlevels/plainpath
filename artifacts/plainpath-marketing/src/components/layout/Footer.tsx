export function Footer() {
  return (
    <footer className="bg-white border-t border-border pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="font-display font-bold text-xl tracking-tight">PlainPath</span>
            </div>
            <p className="text-muted-foreground text-lg max-w-sm">
              Your smart friend for confusing paperwork. Turning legal jargon into plain English action plans.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Product</h4>
            <ul className="space-y-3">
              <li><a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a></li>
              <li><a href="https://plain-path.replit.app" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">Web App</a></li>
              <li><a href="#download" className="text-muted-foreground hover:text-foreground transition-colors">Download iOS</a></li>
              <li><a href="#download" className="text-muted-foreground hover:text-foreground transition-colors">Download Android</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-foreground">Company</h4>
            <ul className="space-y-3">
              <li><a href="https://plain-path.replit.app/support" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">Support</a></li>
              <li><a href="https://plain-path.replit.app/privacy" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a></li>
              <li><a href="https://plain-path.replit.app/terms" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} PlainPath. All rights reserved.</p>
          <p>Designed for everyday people.</p>
        </div>
      </div>
    </footer>
  );
}
