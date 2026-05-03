import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { StickyCTA } from "@/components/StickyCTA";
import { CookieConsent } from "@/components/CookieConsent";
import { ExitIntent } from "@/components/ExitIntent";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import Support from "@/pages/Support";
import ReviewingALease from "@/pages/guides/ReviewingALease";
import UnderstandingAnNDA from "@/pages/guides/UnderstandingAnNDA";
import EmploymentContractRedFlags from "@/pages/guides/EmploymentContractRedFlags";
import UnderstandYourLease from "@/pages/guides/UnderstandYourLease";
import UnderstandYourMedicalBill from "@/pages/guides/UnderstandYourMedicalBill";
import UnderstandYourIrsLetter from "@/pages/guides/UnderstandYourIrsLetter";
import UnderstandYourEmploymentContract from "@/pages/guides/UnderstandYourEmploymentContract";
import VsContractCrab from "@/pages/VsContractCrab";
import VsAiLawyer from "@/pages/VsAiLawyer";
import DemoLanding from "@/pages/DemoLanding";
import DemoAnalyze from "@/pages/DemoAnalyze";
import DemoTrustCheck from "@/pages/DemoTrustCheck";
import DemoBuildContract from "@/pages/DemoBuildContract";
import DemoContractReview from "@/pages/DemoContractReview";
import DemoRedact from "@/pages/DemoRedact";
import DemoCompare from "@/pages/DemoCompare";
import DemoClauseExtractor from "@/pages/DemoClauseExtractor";
import DemoAskDocument from "@/pages/DemoAskDocument";
import DemoBuilder from "@/pages/DemoBuilder";

const queryClient = new QueryClient();

function ExternalRedirect({ to }: { to: string }) {
  useEffect(() => { window.location.replace(to); }, [to]);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />

      {/* Public demo — pre-loaded read-only snapshots, no auth required */}
      <Route path="/demo" component={DemoLanding} />
      <Route path="/demo/analyze" component={DemoAnalyze} />
      <Route path="/demo/contract-review" component={DemoContractReview} />
      <Route path="/demo/trust-check">{() => { window.location.replace("/demo"); return null; }}</Route>
      <Route path="/demo/build-contract">{() => { window.location.replace("/demo"); return null; }}</Route>
      <Route path="/demo/redact">{() => { window.location.replace("/demo"); return null; }}</Route>
      <Route path="/demo/compare">{() => { window.location.replace("/demo"); return null; }}</Route>
      <Route path="/demo/clause-extractor">{() => { window.location.replace("/demo"); return null; }}</Route>
      <Route path="/demo/ask-document">{() => { window.location.replace("/demo"); return null; }}</Route>
      <Route path="/demo/builder">{() => { window.location.replace("/demo"); return null; }}</Route>

      <Route path="/guides/reviewing-a-lease" component={ReviewingALease} />
      <Route path="/guides/understanding-an-nda" component={UnderstandingAnNDA} />
      <Route path="/guides/employment-contract-red-flags" component={EmploymentContractRedFlags} />

      {/* SEO landing pages — document types */}
      <Route path="/understand-your-lease" component={UnderstandYourLease} />
      <Route path="/understand-your-medical-bill" component={UnderstandYourMedicalBill} />
      <Route path="/understand-your-irs-letter" component={UnderstandYourIrsLetter} />
      <Route path="/understand-your-employment-contract" component={UnderstandYourEmploymentContract} />

      {/* Competitor comparison pages */}
      <Route path="/vs-contractcrab" component={VsContractCrab} />
      <Route path="/vs-ai-lawyer" component={VsAiLawyer} />

      <Route path="/pricing">{() => <ExternalRedirect to="/#pricing" />}</Route>
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/support" component={Support} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <StickyCTA />
          <CookieConsent />
          <ExitIntent />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
