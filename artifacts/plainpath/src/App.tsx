import { useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, SignIn, SignUp, useClerk } from "@clerk/react";
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
import TeamDashboard from "@/pages/TeamDashboard";
import JoinTeam from "@/pages/JoinTeam";
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

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
// NOTE: in dev this env var will be empty, in prod it will be automatically set
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

// Clerk passes full paths but wouter's setLocation prepends the base — strip it
function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function SignInPage() {
  // To update login providers, app branding, or OAuth settings use the Auth
  // pane in the workspace toolbar. More information can be found in the Replit docs.
  return (
    <div className="flex justify-center items-start min-h-[calc(100vh-4rem)] pt-12 pb-16 px-4">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        appearance={{
          elements: {
            rootBox: "w-full max-w-md",
            card: "shadow-lg rounded-2xl border border-border/50",
          },
        }}
      />
    </div>
  );
}

function SignUpPage() {
  // To update login providers, app branding, or OAuth settings use the Auth
  // pane in the workspace toolbar. More information can be found in the Replit docs.
  return (
    <div className="flex justify-center items-start min-h-[calc(100vh-4rem)] pt-12 pb-16 px-4">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        appearance={{
          elements: {
            rootBox: "w-full max-w-md",
            card: "shadow-lg rounded-2xl border border-border/50",
          },
        }}
      />
    </div>
  );
}

// Invalidates react-query cache when signed-in user changes
function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <ErrorBoundary>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
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
            <Route path="/build" component={ContractBuilder} />
            <Route path="/review" component={ContractReview} />
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
            <Route path="/team" component={TeamDashboard} />
            <Route path="/join" component={JoinTeam} />
            <Route component={NotFound} />
          </Switch>
        </ErrorBoundary>
      </main>
      <Footer />
      <HelpWidget />
    </div>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <AnalysisProvider>
            <Router />
            <Toaster />
          </AnalysisProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  useEffect(() => {
    void initStatusBar();
    captureInboundRef();
  }, []);

  return (
    <ErrorBoundary>
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
    </ErrorBoundary>
  );
}

export default App;
