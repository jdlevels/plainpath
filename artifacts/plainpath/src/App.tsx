import { useEffect, useRef, useState } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, SignIn, SignUp, useClerk, useUser, useAuth } from "@clerk/react";
import { getApiBaseUrl } from "@/lib/api";
import { useEntitlements } from "@/hooks/useEntitlements";
import { startStripeCheckout } from "@/lib/stripe";
import { PRICING_PLANS } from "@/data/pricingData";
import { ArrowRight, Check, Zap, BarChart3, LogOut, CreditCard, Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnalysisProvider } from "@/context/AnalysisContext";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { initStatusBar } from "@/lib/native";
import { captureInboundRef } from "@/lib/referral";
import { isNative } from "@/lib/platform";
import { configureRevenueCat, purchaseNativePlan, restoreNativePurchases } from "@/lib/nativeBilling";
import { purgeLegacyGlobalKeys, purgeSessionDocumentBuffers } from "@/lib/storageCleanup";

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
import PaywallPreview from "@/pages/PaywallPreview";
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

// Load Clerk JS through the proxy when proxyUrl is configured.
// clerk.plainpathapp.com DNS is not yet pointed at Clerk's CDN, so the
// default clerkJSUrl (derived from the publishable key's custom domain) fails
// with a TLS handshake error.  Routing through the proxy hits
// frontend-api.clerk.dev directly, which does resolve and redirects to the
// pinned version URL — no DNS changes required.
const clerkJSUrl = clerkProxyUrl
  ? `${clerkProxyUrl}/npm/@clerk/clerk-js@6/dist/clerk.browser.js`
  : undefined;

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

function AuthPageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-start min-h-[calc(100vh-4rem)] pt-12 pb-16 px-4">
      {children}
      {/* Visible fallback shown when Clerk JS fails to load (e.g. broken custom domain DNS) */}
      <noscript>
        <p className="mt-8 text-sm text-muted-foreground text-center">
          JavaScript is required to sign in. Please enable it and reload the page.
        </p>
      </noscript>
    </div>
  );
}

function SignInPage() {
  return (
    <AuthPageWrapper>
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
    </AuthPageWrapper>
  );
}

function SignUpPage() {
  return (
    <AuthPageWrapper>
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
    </AuthPageWrapper>
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

// ─── NativePaywallScreen ──────────────────────────────────────────────────────
// Full-screen paywall shown to signed-in native (iOS/Android) users who have
// no active subscription. Uses RevenueCat/StoreKit — no Stripe.

function NativePaywallScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { getToken } = useAuth();
  const { reload } = useEntitlements();
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const clerkUserId = user?.id ?? null;

  useEffect(() => {
    if (clerkUserId) void configureRevenueCat(clerkUserId);
  }, [clerkUserId]);

  async function handlePurchase() {
    if (!clerkUserId) { setError("Sign in required to purchase."); return; }
    setPurchasing(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const result = await purchaseNativePlan("pro", getToken);
      if (result.success) {
        setSuccessMsg("Welcome to PlainPath Pro!");
        await reload();
      } else {
        setError(result.error ?? "Purchase failed. Please try again.");
      }
    } finally {
      setPurchasing(false);
    }
  }

  async function handleRestore() {
    if (!clerkUserId) { setError("Sign in required to restore purchases."); return; }
    setRestoring(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const result = await restoreNativePurchases(getToken);
      if (result.success && result.plan) {
        setSuccessMsg("Subscription restored. Welcome back!");
        await reload();
      } else {
        setError("No active subscription found for this account.");
      }
    } finally {
      setRestoring(false);
    }
  }

  const isWorking = purchasing || restoring;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="PlainPath" className="h-6 w-6" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <span className="font-bold text-base tracking-tight">PlainPath</span>
        </div>
        <button
          onClick={() => { purgeSessionDocumentBuffers(); void signOut({ redirectUrl: "/" }); }}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="bg-primary/10 p-4 rounded-2xl w-fit mx-auto mb-4">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">PlainPath Pro</h1>
            <div className="mt-3">
              <span className="text-3xl font-bold text-foreground">$19.99</span>
              <span className="text-base font-normal text-muted-foreground">/month</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Cancel anytime — no commitment</p>
          </div>

          <ul className="space-y-2.5 mb-8">
            {["Analyze a Document", "Contract Review", "Saved analysis history"].map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-foreground/80">
                <Check className="w-4 h-4 text-primary shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 mb-4 text-sm text-destructive">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/8 px-4 py-3 mb-4 text-sm text-emerald-700 dark:text-emerald-400">
              {successMsg}
            </div>
          )}

          <button
            onClick={() => void handlePurchase()}
            disabled={isWorking}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm mb-3"
          >
            {purchasing ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Processing…</>
            ) : (
              <>Get PlainPath Pro<ArrowRight className="w-4 h-4" /></>
            )}
          </button>

          <button
            onClick={() => void handleRestore()}
            disabled={isWorking}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {restoring ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" />Restoring…</>
            ) : (
              "Restore Purchases"
            )}
          </button>

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground/60 leading-relaxed">
              By subscribing you agree to our{" "}
              <button
                onClick={() => window.open("https://plain-path.replit.app/terms", "_blank")}
                className="underline underline-offset-2 hover:text-muted-foreground transition-colors"
              >
                Terms of Service
              </button>
              {" "}and{" "}
              <button
                onClick={() => window.open("https://plain-path.replit.app/privacy", "_blank")}
                className="underline underline-offset-2 hover:text-muted-foreground transition-colors"
              >
                Privacy Policy
              </button>
              . Subscription auto-renews monthly. Cancel anytime in iPhone Settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ChoosePlanScreen ─────────────────────────────────────────────────────────
// Full-page plan selection shown to signed-in users who have not yet purchased
// a subscription. Initiates Stripe checkout directly — no intermediate page.
const PLAN_ICONS: Record<string, React.ElementType> = { pro: Zap };

function ChoosePlanScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (isNative()) return <NativePaywallScreen />;

  async function handleSelectPlan(planKey: "pro") {
    setLoadingPlan(planKey);
    setError(null);
    try {
      await startStripeCheckout(planKey);
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
          onClick={() => { purgeSessionDocumentBuffers(); void signOut({ redirectUrl: "/" }); }}
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
          <div className="flex justify-center mb-6">
            {PRICING_PLANS.map((plan) => {
              const planKey = (plan.planKey ?? "pro") as "pro";
              const Icon = PLAN_ICONS[planKey] ?? Zap;
              const isHighlight = plan.highlight;
              const isLoading = loadingPlan === planKey;

              return (
                <div
                  key={planKey}
                  className={`relative rounded-3xl border p-10 flex flex-col transition-shadow hover:shadow-xl w-full max-w-sm ${
                    isHighlight
                      ? "border-primary bg-primary/4 shadow-md"
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
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route path="/privacy" component={Privacy} />
            <Route path="/terms" component={Terms} />
            <Route path="/support" component={Support} />
            <Route path="/paywall-preview" component={PaywallPreview} />
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
      clerkJSUrl={clerkJSUrl}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
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
