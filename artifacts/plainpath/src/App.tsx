import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnalysisProvider } from "@/context/AnalysisContext";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { initStatusBar } from "@/lib/native";
import { captureInboundRef } from "@/lib/referral";

import Home from "@/pages/Home";
import Import from "@/pages/Import";
import Analyze from "@/pages/Analyze";
import TrustCheck from "@/pages/TrustCheck";
import MyAnalyses from "@/pages/MyAnalyses";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import Support from "@/pages/Support";
import Subscribe from "./pages/Subscribe";
import SubscribeSuccess from "./pages/SubscribeSuccess";
import SubscribeCancel from "./pages/SubscribeCancel";
import ContractBuilder from "@/pages/ContractBuilder";
import ContractReview from "@/pages/ContractReview";
import SharedAnalysis from "@/pages/SharedAnalysis";
import Compare from "@/pages/Compare";
import Methodology from "@/pages/Methodology";
import IrsLetter from "@/pages/guides/IrsLetter";
import LeaseAgreement from "@/pages/guides/LeaseAgreement";
import JobOffer from "@/pages/guides/JobOffer";
import ScamNotice from "@/pages/guides/ScamNotice";
import NonCompete from "@/pages/guides/NonCompete";
import IndependentContractor from "@/pages/guides/IndependentContractor";
import EvictionNotice from "@/pages/guides/EvictionNotice";
import MedicalBillingDispute from "@/pages/guides/MedicalBillingDispute";
import NotFound from "@/pages/not-found";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HelpWidget } from "@/components/HelpWidget";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    }
  }
});

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <ErrorBoundary>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/import" component={Import} />
            <Route path="/analyze" component={Analyze} />
            <Route path="/trust-check" component={TrustCheck} />
            <Route path="/my-analyses" component={MyAnalyses} />
            <Route path="/privacy" component={Privacy} />
            <Route path="/terms" component={Terms} />
            <Route path="/support" component={Support} />
            <Route path="/pricing">{() => { window.location.replace("/#pricing"); return null; }}</Route>
            <Route path="/subscribe" component={Subscribe} />
            <Route path="/subscribe/success" component={SubscribeSuccess} />
            <Route path="/subscribe/cancel" component={SubscribeCancel} />
            <Route path="/contract-builder" component={ContractBuilder} />
            <Route path="/contract-review" component={ContractReview} />
            <Route path="/shared/:token">
              {(params) => <SharedAnalysis token={(params as { token: string }).token} />}
            </Route>
            <Route path="/compare" component={Compare} />
            <Route path="/methodology" component={Methodology} />
            <Route path="/guides/irs-letter" component={IrsLetter} />
            <Route path="/guides/lease-agreement" component={LeaseAgreement} />
            <Route path="/guides/job-offer-red-flags" component={JobOffer} />
            <Route path="/guides/scam-notice" component={ScamNotice} />
            <Route path="/guides/non-compete-clause" component={NonCompete} />
            <Route path="/guides/independent-contractor-agreement" component={IndependentContractor} />
            <Route path="/guides/eviction-notice" component={EvictionNotice} />
            <Route path="/guides/medical-billing-dispute" component={MedicalBillingDispute} />
            <Route component={NotFound} />
          </Switch>
        </ErrorBoundary>
      </main>
      <Footer />
      <HelpWidget />
    </div>
  );
}

function App() {
  useEffect(() => {
    void initStatusBar()
    captureInboundRef()
  }, [])

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AnalysisProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </AnalysisProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
