import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnalysisProvider } from "@/context/AnalysisContext";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { initStatusBar } from "@/lib/native";

import Home from "@/pages/Home";
import Import from "@/pages/Import";
import Analyze from "@/pages/Analyze";
import TrustCheck from "@/pages/TrustCheck";
import MyAnalyses from "@/pages/MyAnalyses";
import PilotFeedback from "@/pages/PilotFeedback";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import Subscribe from "./pages/Subscribe";
import SubscribeSuccess from "./pages/SubscribeSuccess";
import SubscribeCancel from "./pages/SubscribeCancel";
import ContractBuilder from "@/pages/ContractBuilder";
import NotFound from "@/pages/not-found";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

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
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/import" component={Import} />
          <Route path="/analyze" component={Analyze} />
          <Route path="/trust-check" component={TrustCheck} />
          <Route path="/my-analyses" component={MyAnalyses} />
          <Route path="/pilot-feedback" component={PilotFeedback} />
          <Route path="/privacy" component={Privacy} />
          <Route path="/terms" component={Terms} />
          <Route path="/subscribe" component={Subscribe} />
          <Route path="/subscribe/success" component={SubscribeSuccess} />
          <Route path="/subscribe/cancel" component={SubscribeCancel} />
          <Route path="/contract-builder" component={ContractBuilder} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  useEffect(() => {
    void initStatusBar()
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
