import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

// PORT is only needed for the dev/preview server — not for production builds.
const rawPort = process.env.PORT;
const port = rawPort ? Number(rawPort) : 3000;

// BASE_PATH drives the Vite `base` option.
// Hard-code the fallback to "/app/" so the SPA router is always scoped
// to the /app/ subpath — even if BASE_PATH is not injected by the build runner.
const basePath = process.env.BASE_PATH ?? "/app/";

// ── Clerk publishable key resolution ──────────────────────────────────────────
// CLERK_PUBLISHABLE_KEY (no VITE_ prefix) is the authoritative key because it
// is paired with CLERK_SECRET_KEY on the server.  Both must reference the same
// Clerk instance or JWT verification will fail on every authenticated API call.
// We prefer CLERK_PUBLISHABLE_KEY and fall back to VITE_CLERK_PUBLISHABLE_KEY
// so the frontend always uses the same Clerk instance as the API server.
const clerkPubKeyForFrontend =
  process.env.CLERK_PUBLISHABLE_KEY ||
  process.env.VITE_CLERK_PUBLISHABLE_KEY ||
  "";

export default defineConfig(async ({ mode }) => {
  // VITE_CLERK_PROXY_URL is NOT a Replit secret (it is not injected into the
  // OS env), so process.env.VITE_CLERK_PROXY_URL is undefined at build time.
  // loadEnv reads .env.<mode> files before the define block runs, giving us
  // the value from .env.production without touching any other variable.
  //
  // IMPORTANT: We do NOT apply this to VITE_BUILDER_ENABLED because Replit
  // injects VITE_BUILDER_ENABLED=true into the OS dev env, which would
  // override .env.production's "false" value and accidentally expose the
  // builder in production. All other define entries keep using process.env
  // (the original pattern) to avoid regressions.
  const fileEnv = loadEnv(mode, process.cwd(), "");
  const clerkProxyUrl =
    process.env.VITE_CLERK_PROXY_URL ?? fileEnv.VITE_CLERK_PROXY_URL ?? "";

  return {
    base: basePath,
    define: {
      "import.meta.env.VITE_CLERK_PUBLISHABLE_KEY": JSON.stringify(clerkPubKeyForFrontend),
      // Uses loadEnv to read .env.production — process.env is empty for this
      // key at build time because it is not a Replit-injected OS-level secret.
      "import.meta.env.VITE_CLERK_PROXY_URL": JSON.stringify(clerkProxyUrl),
      "import.meta.env.VITE_BUILDER_ENABLED": JSON.stringify(process.env.VITE_BUILDER_ENABLED ?? ""),
      // VITE_API_BASE_URL: empty string on web (same-origin); absolute URL required for native Capacitor builds.
      // Must be in `define` so it is injected at build time — Vite's automatic VITE_ env loading
      // is not reliable for Replit secrets injected at the OS level.
      "import.meta.env.VITE_API_BASE_URL": JSON.stringify(process.env.VITE_API_BASE_URL ?? ""),
      "import.meta.env.VITE_SENTRY_DSN": JSON.stringify(process.env.VITE_SENTRY_DSN ?? ""),
    },
    plugins: [
      react(),
      tailwindcss(),
      runtimeErrorOverlay(),
      ...(process.env.NODE_ENV !== "production" &&
      process.env.REPL_ID !== undefined
        ? [
            await import("@replit/vite-plugin-cartographer").then((m) =>
              m.cartographer({
                root: path.resolve(import.meta.dirname, ".."),
              }),
            ),
            await import("@replit/vite-plugin-dev-banner").then((m) =>
              m.devBanner(),
            ),
          ]
        : []),
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "src"),
        "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
      },
      dedupe: ["react", "react-dom"],
    },
    root: path.resolve(import.meta.dirname),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      port,
      host: "0.0.0.0",
      allowedHosts: true,
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
    preview: {
      port,
      host: "0.0.0.0",
      allowedHosts: true,
    },
  };
});
