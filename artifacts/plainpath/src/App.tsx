import { useEffect, useRef, useState } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, SignIn, useClerk, useUser } from "@clerk/react";
import { getApiBaseUrl } from "@/lib/api";
import { useEntitlements } from "@/hooks/useEntitlements";
import { startStripeCheckout } from "@/lib/stripe";
import { PRICING_PLANS } from "@/data/pricingData";
import { ArrowRight, Check, Zap, BarChart3, LogOut, CreditCard } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnalysisProvider } from "@/context/AnalysisContext";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { initStatusBar } from "@/lib/native";
import { captureInboundRef } from "@/lib/referral";
import { isNative } from "@/lib/platform";
import { purgeLegacyGlobalKeys } from "@/lib/storageCleanup";

import Home from "@/pages/Home";
import Import from "@/pages/Import";
import AskDocument from "@/pages/AskDocument";
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
import TeamManage from "@/pages/TeamManage";
import JoinTeam from "@/pages/JoinTeam";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HelpWidget } from "@/components/HelpWidget";
import { FirstRunOnboarding } from "@/components/FirstRunOnboarding";
import { OfflineBanner } from "@/components/OfflineBanner";

// VITE_CLERK_PUBLISHABLE_KEY must be just the key value (pk_live_... or pk_test_...).
// Guard against misconfigured secrets where the raw value contains extra content such as:
//   - the full shell assignment  ("VITE_CLERK_PUBLISHABLE_KEY=pk_live_...")
//   - multiple env-var lines pasted together ("pk_live_XXX CLERK_SECRET_KEY=sk_live_...")
// We extract only the valid pk_live_/pk_test_ token using a regex, which stops at the
// first non-base64 character (space, newline, etc.), then fall back to the old slice
// heuristic, and finally to the raw value as-is.
const _rawClerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ?? "";
const _keyMatch = _rawClerkKey.match(/pk_(live|test)_[A-Za-z0-9+/]+=*/);
const clerkPubKey = _keyMatch
  ? _keyMatch[0]
  : (_rawClerkKey.includes("=")
      ? _rawClerkKey.slice(_rawClerkKey.indexOf("=") + 1).trim()
      : _rawClerkKey.trim());

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

// ─── ChoosePlanScreen ─────────────────────────────────────────────────────────
// Full-page plan selection shown to signed-in users who have not yet purchased
// a subscription. Initiates Stripe checkout directly — no intermediate page.
const PLAN_ICONS: Record<string, React.ElementType> = { starter: BarChart3, pro: Zap };

function NativeSubscriptionMessage() {
  const { signOut } = useClerk();
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="PlainPath" className="h-6 w-6" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <span className="font-bold text-base tracking-tight">PlainPath</span>
        </div>
        <button
          onClick={() => void signOut({ redirectUrl: "/" })}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </header>
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <div className="bg-primary/10 p-4 rounded-2xl w-fit mx-auto mb-5">
            <CreditCard className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Manage your subscription</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Subscription management is handled on the PlainPath website.
          </p>
        </div>
      </div>
    </div>
  );
}

function ChoosePlanScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (isNative()) return <NativeSubscriptionMessage />;

  async function handleSelectPlan(planKey: "starter" | "pro") {
    setLoadingPlan(planKey);
    setError(null);
    try {
      await startStripeCheckout(planKey as "starter" | "pro" | "team");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start checkout. Please try again.");
      setLoadingPlan(null);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Minimal header */}
      <header className="border-b border-border/40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="PlainPath" className="h-6 w-6" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <span className="font-bold text-base tracking-tight">PlainPath</span>
        </div>
        <button
          onClick={() => void signOut({ redirectUrl: "/" })}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          {/* Heading */}
          <div className="text-center mb-10">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-3">
              Choose your plan to get started
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
              Select a plan to unlock your PlainPath dashboard. Cancel anytime — no commitment.
            </p>
          </div>

          {/* Plan cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {PRICING_PLANS.map((plan) => {
              const planKey = (plan.planKey ?? "starter") as "starter" | "pro";
              const Icon = PLAN_ICONS[planKey] ?? BarChart3;
              const isHighlight = plan.highlight;
              const isLoading = loadingPlan === planKey;

              return (
                <div
                  key={planKey}
                  className={`relative rounded-2xl border p-6 flex flex-col transition-shadow hover:shadow-md ${
                    isHighlight
                      ? "border-primary bg-primary/4 shadow-sm"
                      : "border-border/60 bg-card"
                  }`}
                >
                  {isHighlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                        Most popular
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2.5 mb-4">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isHighlight ? "bg-primary/12" : "bg-secondary"}`}>
                      <Icon className={`w-4.5 h-4.5 ${isHighlight ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <span className="font-bold text-base text-foreground">{plan.name}</span>
                  </div>

                  <div className="mb-3">
                    <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground text-sm ml-1">{plan.period}</span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed mb-4 flex-1">
                    {plan.description}
                  </p>

                  <ul className="space-y-1.5 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-foreground/80">
                        <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isHighlight ? "text-primary" : "text-emerald-500"}`} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => void handleSelectPlan(planKey)}
                    disabled={loadingPlan !== null}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                      isHighlight
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                        : "bg-secondary text-foreground hover:bg-muted border border-border/50"
                    }`}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Redirecting…
                      </span>
                    ) : (
                      <>
                        {plan.ctaLabel}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Error */}
          {error && (
            <p className="text-center text-sm text-destructive mb-4">{error}</p>
          )}

          {/* Already subscribed */}
          <p className="text-center text-xs text-muted-foreground">
            Already purchased?{" "}
            <a href="/app/billing" className="underline underline-offset-2 hover:text-foreground transition-colors">
              Restore your subscription
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── PlanGate ──────────────────────────────────────────────────────────────────
// Sits between ClerkProvider and the Router. For any signed-in user without an
// active Stripe subscription, the entire dashboard is replaced by ChoosePlanScreen.
//
// Bypass paths (always pass through — these are part of the purchase / auth flow):
//   /sign-in, /sign-up, /subscribe, /billing, /privacy, /terms, /support, /pricing
//
// Admin accounts (ADMIN_EMAILS on the server) bypass the gate — their role is
// set to "admin" at bootstrap and they never need a subscription.
//
// State matrix:
//   Clerk loading              → blank screen
//   Not signed in              → pass through (Router handles public routes)
//   Bypass path                → pass through
//   Signed in, loading         → "Loading…" spinner
//   Signed in, admin           → pass through
//   Signed in, status=active   → pass through
//   Signed in, no subscription → ChoosePlanScreen
function PlanGate({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useUser();
  const { entitlements, loading: entLoading, hasPaidSubscription } = useEntitlements();
  const [location] = useLocation();

  // Paths that must remain accessible during the purchase / auth flow
  const BYPASS_PREFIXES = [
    "/sign-in", "/sign-up", "/subscribe", "/billing",
    "/privacy", "/terms", "/support", "/pricing",
    "/guides", "/shared",
  ];
  const isBypassPath = BYPASS_PREFIXES.some((p) => location.startsWith(p));

  // Clerk still initializing — show nothing to prevent UI flash
  if (!isLoaded) {
    return <div className="min-h-screen bg-background" />;
  }

  // Not signed in or on a bypass path — let the Router handle it
  if (!isSignedIn || isBypassPath) {
    return <>{children}</>;
  }

  // Signed in but entitlements still loading
  if (entLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Admin accounts are always allowed — no subscription required
  if (entitlements?.role === "admin") {
    return <>{children}</>;
  }

  // Confirmed active Stripe subscription → grant access
  if (hasPaidSubscription) {
    return <>{children}</>;
  }

  // No active subscription — require plan selection before dashboard access
  return <ChoosePlanScreen />;
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
            <Route path="/sign-up/*?">{() => { window.location.replace(`${basePath}/sign-in`); return null; }}</Route>
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
            <Route path="/join/:token" component={JoinTeam} />

            {/* ── Protected routes (require sign-in) ── */}
            <Route path="/" component={protect(Home)} />
            <Route path="/import" component={protect(Import)} />
            <Route path="/analyze" component={protect(Import)} />
            <Route path="/ask-document">{() => { window.location.replace(`${basePath}/`); return null; }}</Route>
            <Route path="/ask-this-document">{() => { window.location.replace(`${basePath}/`); return null; }}</Route>
            <Route path="/results" component={protect(Analyze)} />
            <Route path="/trust-check">{() => { window.location.replace(`${basePath}/`); return null; }}</Route>
            <Route path="/my-analyses" component={protect(MyAnalyses)} />
            <Route path="/contract-builder">{() => { window.location.replace(`${basePath}/`); return null; }}</Route>
            <Route path="/build-contract">{() => { window.location.replace(`${basePath}/`); return null; }}</Route>
            <Route path="/contract-review" component={protect(ContractReview)} />
            <Route path="/build">{() => { window.location.replace(`${basePath}/`); return null; }}</Route>
            <Route path="/review" component={protect(ContractReview)} />
            <Route path="/compare">{() => { window.location.replace(`${basePath}/`); return null; }}</Route>
            <Route path="/redact">{() => { window.location.replace(`${basePath}/`); return null; }}</Route>
            <Route path="/billing" component={protect(Billing)} />
            <Route path="/upgrade" component={protect(Upgrade)} />
            <Route path="/team" component={protect(TeamManage)} />
            <Route path="/documents" component={protect(Documents)} />
            <Route path="/account-security" component={protect(AccountSecurity)} />
            <Route path="/clause-extractor">{() => { window.location.replace(`${basePath}/`); return null; }}</Route>
            <Route path="/clause-extractor/:id">{() => { window.location.replace(`${basePath}/`); return null; }}</Route>
            <Route path="/compare-versions">{() => { window.location.replace(`${basePath}/`); return null; }}</Route>
            <Route path="/compare-versions/:id">{() => { window.location.replace(`${basePath}/`); return null; }}</Route>

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
      proxyUrl={clerkProxyUrl || undefined}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <WelcomeEmailTrigger />
        <FirstRunOnboarding />
        <OfflineBanner />
        <TooltipProvider>
          <AnalysisProvider>
            <PlanGate>
              <Router />
            </PlanGate>
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
    purgeLegacyGlobalKeys();
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
