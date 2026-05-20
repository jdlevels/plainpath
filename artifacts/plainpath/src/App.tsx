import { useEffect, useRef, useState } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Link } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, SignIn, SignUp, useClerk, useUser, useAuth } from "@clerk/react";
import { useSignIn, useSignUp } from "@clerk/react/legacy";
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

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

// ─── Clerk proxy URL ──────────────────────────────────────────────────────────
//
// PROBLEM: VITE_CLERK_PROXY_URL is baked into the bundle as a static string
// (https://plain-path.replit.app/api/__clerk). When users access the app from
// plainpathapp.com, all Clerk API calls go cross-origin to plain-path.replit.app.
// The Clerk proxy is mounted in app.ts BEFORE the CORS middleware, so those
// cross-origin requests never receive CORS headers — the browser blocks them.
// Clerk's /v1/client call fails silently, isLoaded stays false forever, and
// ClerkLoadingScreen shows "Unable to connect" after 10 s.
//
// FIX: In a web browser, derive the proxy URL from window.location.origin so
// Clerk API calls are always same-origin — no CORS preflight is triggered at all.
// In Capacitor native (iOS/Android), the origin is "capacitor://localhost" or
// "http://localhost" which has no backend, so we fall back to the configured
// env var (the native shell is in the CORS allowlist, so cross-origin works).
//
// Result:
//   plainpathapp.com  → https://plainpathapp.com/api/__clerk   (same-origin)
//   plain-path.replit.app → https://plain-path.replit.app/api/__clerk  (same-origin)
//   Capacitor iOS     → https://plain-path.replit.app/api/__clerk  (env var, CORS ok)
const _configuredProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL as string | undefined;
const _nativeOrigins = ["capacitor://localhost", "http://localhost", "https://localhost"];
const clerkProxyUrl: string | undefined = (() => {
  if (typeof window === "undefined") return _configuredProxyUrl;
  if (_nativeOrigins.includes(window.location.origin)) return _configuredProxyUrl;
  // Web browser — use same origin to avoid cross-origin Clerk API calls
  return `${window.location.origin}/api/__clerk`;
})();

// ─── Clerk JS bundle URL ──────────────────────────────────────────────────────
//
// Do NOT override __internal_clerkJSUrl. Clerk's default behavior when proxyUrl
// is set: loads its JS bundle from ${proxyUrl}/npm/@clerk/clerk-js@VERSION/dist/clerk.browser.js.
// Our proxy forwards that to frontend-api.clerk.dev, which works correctly and
// has been verified to return HTTP 307 → actual bundle.
//
// npm.clerk.dev (previously used) does NOT resolve (DNS NXDOMAIN) — setting
// __internal_clerkJSUrl to that URL caused Clerk JS to never load, keeping
// isLoaded=false and showing "Unable to connect" after 10 s on plainpathapp.com.

// DO NOT throw at module level here. A module-level throw crashes the entire
// JS bundle — createRoot().render() in main.tsx never runs, React never mounts,
// and the device shows a blank screen even though the static launch shell HTML
// is present. Instead, record the error and render it as a visible UI component.
const clerkKeyError: string | null =
  (!clerkPubKey || (!clerkPubKey.startsWith("pk_live_") && !clerkPubKey.startsWith("pk_test_")))
    ? `VITE_CLERK_PUBLISHABLE_KEY is missing or invalid. Got: "${_rawClerkKey.slice(0, 20)}..."`
    : null;

// Clerk passes full paths but wouter's setLocation prepends the base — strip it
function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

// Normalise any URL Clerk hands to routerPush/routerReplace.
//
// On native, Clerk occasionally produces an absolute URL derived from the
// proxy origin (e.g. "https://plain-path.replit.app/") rather than a bare
// path.  Passing a full URL to wouter's setLocation triggers
// history.replaceState with a cross-origin URL which is blocked by WKWebView
// and leaves the user stuck on native.  We extract just the pathname + query
// + hash so the navigation always stays inside the SPA regardless of what
// Clerk generates.
function toSpaPath(rawTo: string): string {
  try {
    if (rawTo.startsWith("http://") || rawTo.startsWith("https://")) {
      const u = new URL(rawTo);
      const rel = u.pathname + u.search + u.hash;
      return stripBase(rel) || "/";
    }
  } catch {
    // malformed URL — fall through to stripBase
  }
  return stripBase(rawTo);
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

// After a successful sign-in or sign-up on WEB, send the user to the app dashboard.
const afterAuthUrl = `${basePath}/import`;

// ─── Native custom sign-in ────────────────────────────────────────────────────
// The prebuilt Clerk <SignIn> component constructs redirect/callback URLs using
// window.location.origin.  On Capacitor that origin is "capacitor://localhost",
// which Clerk's servers reject with "invalid_url_scheme".
// We use the raw useSignIn() hook instead: it never constructs redirect URLs,
// so it works correctly on any URL scheme.
function NativeSignInForm() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [, setLocation] = useLocation();
  const [stage, setStage] = useState<"credentials" | "mfa">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaStrategy, setMfaStrategy] = useState<string>("totp");
  const [mfaLabel, setMfaLabel] = useState<string>("authenticator app");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isLoaded) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  function clerkMsg(e: unknown) {
    return (e as { errors?: Array<{ longMessage?: string; message?: string }> })
      ?.errors?.[0]?.longMessage
      ?? (e as { errors?: Array<{ message?: string }> })?.errors?.[0]?.message
      ?? "Sign-in failed. Please try again.";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!signIn) return;
    setLoading(true);
    setErr(null);
    try {
      const result = await signIn.create({ identifier: email, password });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        setLocation("/import");
      } else if (result.status === "needs_second_factor") {
        // Account has MFA enabled — determine the available strategy and prompt.
        // Priority: totp (no network round-trip) → phone_code → email_code
        const factors: Array<{ strategy: string }> = (result as any).supportedSecondFactors ?? [];
        const strategy =
          factors.find(f => f.strategy === "totp")?.strategy ??
          factors.find(f => f.strategy === "phone_code")?.strategy ??
          factors.find(f => f.strategy === "email_code")?.strategy ??
          "totp";
        const label =
          strategy === "totp" ? "authenticator app" :
          strategy === "phone_code" ? "SMS text message" : "email";
        setMfaStrategy(strategy);
        setMfaLabel(label);
        // phone_code / email_code require the server to send the OTP first
        if (strategy === "phone_code" || strategy === "email_code") {
          await signIn.prepareSecondFactor({ strategy: strategy as any });
        }
        setMfaCode("");
        setStage("mfa");
      } else {
        setErr(`Sign-in could not be completed (status: ${result.status}). Please contact support.`);
      }
    } catch (e: unknown) {
      setErr(clerkMsg(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleMfa(e: React.FormEvent) {
    e.preventDefault();
    if (!signIn) return;
    setLoading(true);
    setErr(null);
    try {
      const result = await signIn.attemptSecondFactor({ strategy: mfaStrategy as any, code: mfaCode });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        setLocation("/import");
      } else {
        setErr("Verification failed. Please check the code and try again.");
      }
    } catch (e: unknown) {
      setErr(clerkMsg(e));
    } finally {
      setLoading(false);
    }
  }

  if (stage === "mfa") {
    return (
      <div className="flex flex-col items-center justify-start min-h-[calc(100vh-4rem)] pt-12 pb-16 px-4">
        <div className="w-full max-w-sm">
          <div className="shadow-lg rounded-2xl border border-border/50 bg-card p-8 space-y-5">
            <div>
              <h1 className="text-xl font-bold text-foreground mb-1">Two-step verification</h1>
              <p className="text-sm text-muted-foreground">
                Enter the code from your {mfaLabel}.
              </p>
            </div>
            <form onSubmit={handleMfa} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground">Verification code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={mfaCode}
                  onChange={e => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  autoComplete="one-time-code"
                  autoFocus
                  disabled={loading}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-center tracking-[0.35em] text-lg font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60"
                  placeholder="000000"
                />
              </div>
              {err && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2.5 text-sm text-destructive">
                  {err}
                </div>
              )}
              <button
                type="submit"
                disabled={loading || mfaCode.length < 6}
                className="w-full bg-primary text-primary-foreground font-medium text-sm rounded-lg px-4 py-2.5 hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Verifying…" : "Verify"}
              </button>
              <button
                type="button"
                onClick={() => { setStage("credentials"); setErr(null); setMfaCode(""); }}
                disabled={loading}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                ← Back to sign in
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-[calc(100vh-4rem)] pt-12 pb-16 px-4">
      <div className="w-full max-w-sm">
        <div className="shadow-lg rounded-2xl border border-border/50 bg-card p-8 space-y-5">
          <div>
            <h1 className="text-xl font-bold text-foreground mb-1">Sign in to PlainPath</h1>
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/sign-up" className="text-primary hover:underline font-medium">Sign up</Link>
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="email"
                disabled={loading}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60"
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60"
                placeholder="••••••••"
              />
            </div>
            {err && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2.5 text-sm text-destructive">
                {err}
              </div>
            )}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full bg-primary text-primary-foreground font-medium text-sm rounded-lg px-4 py-2.5 hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Native custom sign-up ────────────────────────────────────────────────────
// Same rationale as NativeSignInForm — no prebuilt component, no redirect URL.
function NativeSignUpForm() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [, setLocation] = useLocation();
  const [stage, setStage] = useState<"form" | "verify">("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isLoaded) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  function clerkMsg(e: unknown) {
    return (e as { errors?: Array<{ longMessage?: string; message?: string }> })
      ?.errors?.[0]?.longMessage
      ?? (e as { errors?: Array<{ message?: string }> })?.errors?.[0]?.message
      ?? "Something went wrong. Please try again.";
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!signUp) return;
    setLoading(true);
    setErr(null);
    try {
      const result = await signUp.create({ emailAddress: email, password });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        setLocation("/import");
      } else {
        // Email verification required — request the OTP code
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        setStage("verify");
      }
    } catch (e: unknown) {
      setErr(clerkMsg(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!signUp) return;
    setLoading(true);
    setErr(null);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        setLocation("/import");
      } else {
        setErr("Verification failed. Please check the code and try again.");
      }
    } catch (e: unknown) {
      setErr(clerkMsg(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-[calc(100vh-4rem)] pt-12 pb-16 px-4">
      <div className="w-full max-w-sm">
        <div className="shadow-lg rounded-2xl border border-border/50 bg-card p-8 space-y-5">
          {stage === "form" ? (
            <>
              <div>
                <h1 className="text-xl font-bold text-foreground mb-1">Create your account</h1>
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/sign-in" className="text-primary hover:underline font-medium">Sign in</Link>
                </p>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-foreground">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoCapitalize="none"
                    autoCorrect="off"
                    autoComplete="email"
                    disabled={loading}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60"
                    placeholder="you@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-foreground">Password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="new-password"
                    disabled={loading}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60"
                    placeholder="At least 8 characters"
                  />
                </div>
                {err && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2.5 text-sm text-destructive">
                    {err}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading || !email || !password}
                  className="w-full bg-primary text-primary-foreground font-medium text-sm rounded-lg px-4 py-2.5 hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? "Creating account…" : "Create account"}
                </button>
              </form>
            </>
          ) : (
            <>
              <div>
                <h1 className="text-xl font-bold text-foreground mb-1">Check your email</h1>
                <p className="text-sm text-muted-foreground">
                  We sent a 6-digit code to <strong className="text-foreground">{email}</strong>
                </p>
              </div>
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-foreground">Verification code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    autoComplete="one-time-code"
                    disabled={loading}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-center tracking-[0.35em] text-lg font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60"
                    placeholder="000000"
                  />
                </div>
                {err && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2.5 text-sm text-destructive">
                    {err}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading || code.length < 6}
                  className="w-full bg-primary text-primary-foreground font-medium text-sm rounded-lg px-4 py-2.5 hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? "Verifying…" : "Verify email"}
                </button>
                <button
                  type="button"
                  onClick={() => setStage("form")}
                  disabled={loading}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                >
                  ← Back
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SignInPage() {
  // On native (capacitor://localhost), the prebuilt <SignIn> component builds
  // OAuth callback URLs from window.location.origin — "capacitor://localhost"
  // is rejected by Clerk's servers with "invalid_url_scheme".
  // Use the raw hook-based form instead; it never touches redirect URLs.
  if (isNative()) return <NativeSignInForm />;
  return (
    <AuthPageWrapper>
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        forceRedirectUrl={afterAuthUrl}
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
  if (isNative()) return <NativeSignUpForm />;
  return (
    <AuthPageWrapper>
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        forceRedirectUrl={afterAuthUrl}
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
          onClick={() => { purgeSessionDocumentBuffers(); void signOut({ redirectUrl: `${basePath}/sign-in` }); }}
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
          onClick={() => { purgeSessionDocumentBuffers(); void signOut({ redirectUrl: `${basePath}/sign-in` }); }}
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

// ─── ClerkLoadingScreen ───────────────────────────────────────────────────────
// Shown while Clerk is initializing (isLoaded === false).
//
// Replaces the previous blank-screen approach that caused Apple Guideline 2.1
// rejection: the app appeared to load no content on launch.
//
// Behavior:
//   0–10 s  → spinner on the app background color (visually indicates activity)
//   > 10 s  → "Unable to connect" screen with a Reload button
//             (covers the case where Clerk JS itself failed to load, e.g. cold
//              network timeout in the review environment)
//
// On native: a diagnostic bar is pinned to the bottom of the screen showing
// origin, pathname, mode, and build number so device logs are readable without
// attaching a debugger.

function ClerkLoadingScreen() {
  const [timedOut, setTimedOut] = useState(false);
  const native = isNative();
  const origin = typeof window !== "undefined" ? window.location.origin : "—";
  const pathname = typeof window !== "undefined" ? window.location.pathname : "—";
  const buildNum = (import.meta.env.VITE_BUILD_NUMBER as string | undefined) || "dev";

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 10000);
    return () => clearTimeout(t);
  }, []);

  const diagnosticBar = native ? (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      background: "rgba(0,0,0,0.80)", color: "#fff",
      fontSize: 10, fontFamily: "monospace",
      padding: "6px 12px 10px", lineHeight: 1.6,
      zIndex: 9999,
    }}>
      mode: native · origin: {origin} · path: {pathname} · build: {buildNum} · auth: pending
    </div>
  ) : null;

  if (timedOut) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center max-w-xs">
          <div className="bg-muted p-4 rounded-2xl w-fit mx-auto mb-5">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">Unable to connect</p>
          <p className="text-xs text-muted-foreground leading-relaxed mb-5">
            Check your internet connection and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
          >
            Reload
          </button>
        </div>
        {diagnosticBar}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-7 h-7 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      {diagnosticBar}
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
//   Clerk loading              → spinner (ClerkLoadingScreen, max 10 s then retry UI)
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

  // Clerk still initializing — show spinner (not blank) to satisfy App Store Guideline 2.1
  if (!isLoaded) {
    return <ClerkLoadingScreen />;
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

// Global auth guard — redirects unauthenticated users to the public marketing site
// on web, or to /sign-in inside the SPA on native.
//
// On native: uses wouter setLocation (synchronous, no WebView reload, no loop).
// On web: uses window.location.replace to the marketing site root.
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useUser();
  const [, setLocation] = useLocation();

  if (!isLoaded) {
    return <ClerkLoadingScreen />;
  }

  if (!isSignedIn) {
    if (isNative()) {
      // Synchronous wouter navigation — stays inside the SPA, no WebView reload.
      setLocation("/sign-in", { replace: true });
      return null;
    }
    window.location.replace("/");
    return null;
  }

  return <>{children}</>;
}

// Redirects that work correctly on both web and native.
// On web: uses window.location.replace (may navigate outside the SPA).
// On native: uses wouter setLocation (stays inside the SPA, no WebView reload).
function NativeSafeRedirect({ nativeTo, webHref }: { nativeTo: string; webHref: string }) {
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (isNative()) {
      setLocation(nativeTo, { replace: true });
    } else {
      window.location.replace(webHref);
    }
  }, []);
  return null;
}

// ─── NativeRootGate ───────────────────────────────────────────────────────────
// Top-level guard placed BEFORE PlanGate and Router so it runs before any route,
// Navbar, or Footer can render on native.
//
// On native, paths that belong to the marketing site (/, /demo, /pricing, etc.)
// must never render — they have no equivalent in the native bundle and any
// window.location call on these paths causes an infinite WebView reload loop.
//
// Behavior:
//   • non-native          → pass through immediately, no-op
//   • native + app path   → pass through to PlanGate / Router
//   • native + mktg path + Clerk loading → show ClerkLoadingScreen (spinner)
//   • native + mktg path + signed in     → navigate to /import (dashboard)
//   • native + mktg path + not signed in → navigate to /sign-in
//
// Navigation is done via useEffect (not synchronously in render) so React's
// rendering rules are respected. ClerkLoadingScreen is shown during the one
// render cycle before the effect fires, so the user never sees marketing content.

const NATIVE_MARKETING_PATHS = ["/", "/app", "/app/", "/demo", "/demo/analyze", "/pricing", "/website"];

function NativeRootGate({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { isLoaded, isSignedIn } = useUser();

  const native = isNative();
  const isMarketingPath = native && NATIVE_MARKETING_PATHS.includes(location);

  useEffect(() => {
    if (!isMarketingPath || !isLoaded) return;
    setLocation(isSignedIn ? "/import" : "/sign-in", { replace: true });
  }, [isMarketingPath, isLoaded, isSignedIn]);

  // On a marketing path on native: block everything below and show loading
  // screen until the useEffect redirect fires.
  if (isMarketingPath) {
    return <ClerkLoadingScreen />;
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
            <Route path="/pricing">{() => <NativeSafeRedirect nativeTo="/subscribe" webHref="/#pricing" />}</Route>
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
            <Route path="/demo/analyze">{() => <NativeSafeRedirect nativeTo="/sign-in" webHref="/demo/analyze" />}</Route>
            <Route path="/demo">{() => <NativeSafeRedirect nativeTo="/sign-in" webHref="/demo" />}</Route>
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
            <Route path="/ask-document">{() => <NativeSafeRedirect nativeTo="/import" webHref={`${basePath}/`} />}</Route>
            <Route path="/ask-this-document">{() => <NativeSafeRedirect nativeTo="/import" webHref={`${basePath}/`} />}</Route>
            <Route path="/results" component={protect(Analyze)} />
            <Route path="/trust-check">{() => <NativeSafeRedirect nativeTo="/import" webHref={`${basePath}/`} />}</Route>
            <Route path="/my-analyses" component={protect(MyAnalyses)} />
            <Route path="/contract-builder">{() => <NativeSafeRedirect nativeTo="/import" webHref={`${basePath}/`} />}</Route>
            <Route path="/build-contract">{() => <NativeSafeRedirect nativeTo="/import" webHref={`${basePath}/`} />}</Route>
            <Route path="/contract-review" component={protect(ContractReview)} />
            <Route path="/build">{() => <NativeSafeRedirect nativeTo="/import" webHref={`${basePath}/`} />}</Route>
            <Route path="/review" component={protect(ContractReview)} />
            <Route path="/compare">{() => <NativeSafeRedirect nativeTo="/import" webHref={`${basePath}/`} />}</Route>
            <Route path="/redact">{() => <NativeSafeRedirect nativeTo="/import" webHref={`${basePath}/`} />}</Route>
            <Route path="/billing" component={protect(Billing)} />
            <Route path="/upgrade" component={protect(Upgrade)} />
            <Route path="/team" component={protect(TeamManage)} />
            <Route path="/documents" component={protect(Documents)} />
            <Route path="/account-security" component={protect(AccountSecurity)} />
            <Route path="/clause-extractor">{() => <NativeSafeRedirect nativeTo="/import" webHref={`${basePath}/`} />}</Route>
            <Route path="/clause-extractor/:id">{() => <NativeSafeRedirect nativeTo="/import" webHref={`${basePath}/`} />}</Route>
            <Route path="/compare-versions">{() => <NativeSafeRedirect nativeTo="/import" webHref={`${basePath}/`} />}</Route>
            <Route path="/compare-versions/:id">{() => <NativeSafeRedirect nativeTo="/import" webHref={`${basePath}/`} />}</Route>

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

  // If the Clerk key is invalid, render a visible error instead of crashing.
  // This surfaces as a readable screen on device rather than a blank white screen.
  if (clerkKeyError) {
    return (
      <div style={{
        position: "fixed", inset: 0, background: "#F8F7F4",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
        padding: "24px", textAlign: "center", gap: "12px",
      }}>
        <div style={{ fontSize: 40 }}>⚠️</div>
        <p style={{ fontWeight: 700, fontSize: 18, color: "#1a1a1a", margin: 0 }}>PlainPath — Config Error</p>
        <p style={{ fontSize: 13, color: "#666", margin: 0, maxWidth: 320 }}>{clerkKeyError}</p>
        <p style={{ fontSize: 11, color: "#999", margin: 0 }}>Build: {import.meta.env.VITE_BUILD_NUMBER ?? "dev"}</p>
      </div>
    );
  }

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl || undefined}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(toSpaPath(to))}
      routerReplace={(to) => setLocation(toSpaPath(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <WelcomeEmailTrigger />
        <FirstRunOnboarding />
        <OfflineBanner />
        <TooltipProvider>
          <AnalysisProvider>
            <NativeRootGate>
              <PlanGate>
                <Router />
              </PlanGate>
            </NativeRootGate>
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

    // ── Startup diagnostic ────────────────────────────────────────────────────
    // Marks the "React mounted" state in the static launch shell so that on a
    // real device with a blank screen we can tell whether JS loaded at all.
    // Also removes the launch shell so it cannot block the React UI.
    const shell = document.getElementById("pp-launch-shell");
    const reactMarker = document.getElementById("pp-react-marker");
    const buildNum = (import.meta.env.VITE_BUILD_NUMBER as string | undefined) || "dev";
    const assetMode = (import.meta.env.VITE_ASSET_MODE as string | undefined) || "web";
    if (reactMarker) reactMarker.textContent = `✓ React mounted · Build: ${buildNum} · Mode: ${assetMode}`;
    // Give React one frame to paint its own UI before removing the shell
    requestAnimationFrame(() => {
      if (shell) shell.style.display = "none";
    });
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
