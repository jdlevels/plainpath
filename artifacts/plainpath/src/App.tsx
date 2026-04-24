import { useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, SignIn, SignUp, useClerk, useUser } from "@clerk/react";
import { useEntitlements } from "@/hooks/useEntitlements";
import { getApiBaseUrl } from "@/lib/api";
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
import CompareVersions from "@/pages/CompareVersions";
import CompareVersionsSession from "@/pages/CompareVersionsSession";
import Redact from "@/pages/Redact";
import Billing from "@/pages/Billing";
import Upgrade from "@/pages/Upgrade";
import Signature from "@/pages/Signature";
import Documents from "@/pages/Documents";
import AccountSecurity from "@/pages/AccountSecurity";
import ClauseExtractor from "@/pages/ClauseExtractor"
import Methodology from "@/pages/Methodology";
import BuilderList from "@/pages/Builder/index";
import BuilderNew from "@/pages/Builder/New";
import BuilderWorkspace from "@/pages/Builder/Workspace";
import { BUILDER_ENABLED } from "@/lib/builderConfig";
import Demo from "@/pages/Demo";
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

// VITE_CLERK_PUBLISHABLE_KEY must be just the key value (pk_live_... or pk_test_...).
// Guard against a common misconfiguration where the entire shell assignment line
// ("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...") was pasted as the secret value.
// In that case we extract everything after the first "=" so Clerk receives a valid key.
const _rawClerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ?? "";
const clerkPubKey = _rawClerkKey.includes("=")
  ? _rawClerkKey.slice(_rawClerkKey.indexOf("=") + 1).trim()
  : _rawClerkKey.trim();

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

if (!clerkPubKey || (!clerkPubKey.startsWith("pk_live_") && !clerkPubKey.startsWith("pk_test_"))) {
  throw new Error(
    `VITE_CLERK_PUBLISHABLE_KEY is missing or invalid. ` +
    `Expected a value starting with pk_live_ or pk_test_, got: "${_rawClerkKey.slice(0, 20)}..."`
  );
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

// Sends a one-time welcome email to new users (fires only if account < 15 min old)
function WelcomeEmailTrigger() {
  const { user } = useUser();
  useEffect(() => {
    if (!user?.primaryEmailAddress?.emailAddress) return;
    const key = `welcome_sent_${user.id}`;
    if (localStorage.getItem(key)) return;
    const createdAt = new Date((user as any).createdAt ?? 0).getTime();
    const minsAgo = (Date.now() - createdAt) / 60000;
    if (minsAgo > 15) return;
    localStorage.setItem(key, "1");
    const base = getApiBaseUrl();
    fetch(`${base}/api/reminders/welcome`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.primaryEmailAddress.emailAddress,
        firstName: user.firstName ?? undefined,
      }),
    }).catch(() => {});
  }, [user]);
  return null;
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

// ─── UnauthorizedScreen ────────────────────────────────────────────────────────
// Shown to any signed-in Clerk user whose email is not in the server-side
// ALLOWED_EMAILS list. This replaces the entire app UI — no nav, no pages.
function UnauthorizedScreen() {
  const { signOut } = useClerk();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center max-w-sm space-y-5">
        <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
          <svg
            className="w-7 h-7 text-destructive"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight">Access Restricted</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            PlainPath is currently invite-only. Your account is not authorized
            to access this application. If you believe this is an error, contact{" "}
            <a
              href="mailto:support@plainpathapp.com"
              className="underline underline-offset-2 text-foreground hover:text-primary transition-colors"
            >
              support@plainpathapp.com
            </a>
            .
          </p>
        </div>
        <button
          onClick={() => void signOut({ redirectUrl: "/" })}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-secondary transition-colors text-sm font-medium"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
            />
          </svg>
          Sign out
        </button>
      </div>
    </div>
  );
}

// ─── AllowlistGate ─────────────────────────────────────────────────────────────
// Top-level gate that sits between ClerkProvider and the Router.
// Intercepts signed-in users before any page renders and checks whether they
// have valid entitlements. If entitlements are null after loading (backend
// returned 403 for non-allowlisted users), the entire app is replaced with
// UnauthorizedScreen. This prevents unauthorized users from seeing any page,
// including Home, Billing, and all tool routes.
//
// State matrix:
//   Clerk loading               → blank screen (prevents flash of UI)
//   Not signed in               → pass through (Router handles public routes)
//   Signed in, ent. loading     → "Verifying access…" spinner
//   Signed in, ent. null        → UnauthorizedScreen (sign-out button)
//   Signed in, ent. valid       → pass through (render the app)
function AllowlistGate({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useUser();
  const { entitlements, loading: entLoading } = useEntitlements();

  // Clerk still initializing — show nothing to prevent any UI flash
  if (!isLoaded) {
    return <div className="min-h-screen bg-background" />;
  }

  // Not signed in — let the Router handle public routes and sign-in redirects
  if (!isSignedIn) {
    return <>{children}</>;
  }

  // Signed in but entitlements still resolving — show a neutral loading state
  if (entLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Verifying access…</p>
        </div>
      </div>
    );
  }

  // Signed in and loaded, but entitlements are null:
  // backend returned 403 (email not in ALLOWED_EMAILS) or some other failure.
  // Replace the entire app with the unauthorized screen.
  if (!entitlements) {
    return <UnauthorizedScreen />;
  }

  // Authorized — render the full application
  return <>{children}</>;
}

// Global auth guard — redirects unauthenticated users to the public marketing site.
// Renders nothing (blank screen) while Clerk is still resolving auth state to
// prevent any flash of protected content.
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!isSignedIn) {
    window.location.replace("/");
    return <div className="min-h-screen bg-background" />;
  }

  return <>{children}</>;
}

// Convenience wrapper so Route's component prop works with RequireAuth
function protect(Component: React.ComponentType) {
  return function ProtectedPage() {
    return (
      <RequireAuth>
        <Component />
      </RequireAuth>
    );
  };
}

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <ErrorBoundary>
          <Switch>
            {/* ── Public routes (no auth required) ── */}
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route path="/privacy" component={Privacy} />
            <Route path="/terms" component={Terms} />
            <Route path="/support" component={Support} />
            <Route path="/methodology" component={Methodology} />
            <Route path="/pricing">{() => { window.location.replace("/#pricing"); return null; }}</Route>
            <Route path="/guides/irs-letter" component={IrsLetter} />
            <Route path="/guides/lease-agreement" component={LeaseAgreement} />
            <Route path="/guides/job-offer-red-flags" component={JobOffer} />
            <Route path="/guides/scam-notice" component={ScamNotice} />
            <Route path="/guides/non-compete-clause" component={NonCompete} />
            <Route path="/guides/independent-contractor-agreement" component={IndependentContractor} />
            <Route path="/guides/eviction-notice" component={EvictionNotice} />
            <Route path="/guides/medical-billing-dispute" component={MedicalBillingDispute} />
            {/* Shared analysis links are public — shareable with non-users */}
            <Route path="/shared/:token">
              {(params) => <SharedAnalysis token={(params as { token: string }).token} />}
            </Route>
            {/* Public free-trial demo — canonical route is /demo on the marketing site.
                Redirect any /app/demo and /app/demo/analyze visitors there. */}
            <Route path="/demo/analyze">{() => { window.location.replace("/demo/analyze"); return null; }}</Route>
            <Route path="/demo">{() => { window.location.replace("/demo"); return null; }}</Route>
            {/* Shared product demo documents — accessible at /app/demo/:id */}
            <Route path="/demo/:id">
              {(params) => <Demo id={(params as { id: string }).id} />}
            </Route>

            {/* ── Subscribe routes — public (no sign-in required to start checkout) ── */}
            <Route path="/subscribe" component={Subscribe} />
            <Route path="/subscribe/success" component={SubscribeSuccess} />
            <Route path="/subscribe/cancel" component={SubscribeCancel} />

            {/* ── Protected routes (require sign-in) ── */}
            <Route path="/" component={protect(Home)} />
            <Route path="/import" component={protect(Import)} />
            <Route path="/analyze" component={protect(Import)} />
            <Route path="/results" component={protect(Analyze)} />
            <Route path="/trust-check" component={protect(TrustCheck)} />
            <Route path="/my-analyses" component={protect(MyAnalyses)} />
            <Route path="/contract-builder" component={protect(ContractBuilder)} />
            <Route path="/build-contract" component={protect(ContractBuilder)} />
            <Route path="/contract-review" component={protect(ContractReview)} />
            <Route path="/build" component={protect(ContractBuilder)} />
            <Route path="/review" component={protect(ContractReview)} />
            <Route path="/compare" component={protect(Compare)} />
            <Route path="/redact" component={protect(Redact)} />
            <Route path="/billing" component={protect(Billing)} />
            <Route path="/upgrade" component={protect(Upgrade)} />
            <Route path="/signature" component={protect(Signature)} />
            <Route path="/documents" component={protect(Documents)} />
            <Route path="/account-security" component={protect(AccountSecurity)} />
            <Route path="/clause-extractor" component={protect(ClauseExtractor)} />
            <Route path="/clause-extractor/:id" component={protect(ClauseExtractor)} />
            <Route path="/compare-versions" component={protect(CompareVersions)} />
            <Route path="/compare-versions/:id">
              {(params) => {
                const C = protect(() => <CompareVersionsSession sessionId={params.id!} />)
                return <C />
              }}
            </Route>

            {BUILDER_ENABLED && (
              <>
                <Route path="/builder/new" component={protect(BuilderNew)} />
                <Route path="/builder/:id">
                  {(params) => (
                    <RequireAuth>
                      <BuilderWorkspace docId={params.id!} />
                    </RequireAuth>
                  )}
                </Route>
                <Route path="/builder" component={protect(BuilderList)} />
              </>
            )}

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
        <WelcomeEmailTrigger />
        <TooltipProvider>
          <AnalysisProvider>
            <AllowlistGate>
              <Router />
            </AllowlistGate>
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
