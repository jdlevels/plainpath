import { defineConfig } from "vite";
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

export default defineConfig({
  base: basePath,
  define: {
    "import.meta.env.VITE_CLERK_PUBLISHABLE_KEY": JSON.stringify(process.env.VITE_CLERK_PUBLISHABLE_KEY ?? ""),
    "import.meta.env.VITE_CLERK_PROXY_URL": JSON.stringify(process.env.VITE_CLERK_PROXY_URL ?? ""),
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
});
