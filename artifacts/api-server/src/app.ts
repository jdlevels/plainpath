import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import multer from "multer";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// ---------------------------------------------------------------------------
// CORS
//
// Origins that Capacitor native apps always use, regardless of environment:
//   - capacitor://localhost  → iOS Capacitor WebView
//   - http://localhost       → Android Capacitor WebView
//
// In development (NODE_ENV !== "production") all origins are allowed so local
// testing and hot-reload work without configuration.
//
// In production, allowed origins are restricted to:
//   1. The above Capacitor origins (always included)
//   2. Any comma-separated origins in the CORS_ORIGINS env var
//      e.g. CORS_ORIGINS=https://plainpath.app,https://www.plainpath.app
//
// Required env var for production native builds:
//   CORS_ORIGINS — add the deployed web domain(s) here
// ---------------------------------------------------------------------------

// "capacitor://localhost"  → iOS Capacitor WebView
// "http://localhost"       → Android Capacitor WebView (default scheme)
// "https://localhost"      → Android when androidScheme is set to "https" (our config)
const CAPACITOR_ORIGINS = [
  "capacitor://localhost",
  "http://localhost",
  "https://localhost",
];

const configuredOrigins: string[] = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",")
      .map((o) => o.trim())
      .filter(Boolean)
  : [];

const isProduction = process.env.NODE_ENV === "production";

app.use(
  cors({
    origin: isProduction
      ? (origin, callback) => {
          // Allow requests with no origin header (same-origin, server-to-server, curl).
          if (!origin) return callback(null, true);
          const allowed = [...CAPACITOR_ORIGINS, ...configuredOrigins];
          if (allowed.includes(origin)) return callback(null, true);
          logger.warn({ origin }, "CORS: rejected disallowed origin");
          callback(new Error("CORS: origin not allowed"));
        }
      : true, // Allow all origins in development
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        error: "file_too_large",
        message: "File is too large. Maximum allowed size is 20 MB.",
      });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        error: "upload_field_error",
        message: "Upload error: unexpected file field. Please try again.",
      });
    }
    return res.status(400).json({
      error: "upload_error",
      message: "Upload failed due to a form error. Please try again.",
    });
  }

  const errMsg = err instanceof Error ? err.message : String(err);
  logger.error({ err: errMsg, url: req.url, method: req.method }, "Unhandled error reached global handler");

  // Classify common error types that escape route handlers
  if (typeof errMsg === "string") {
    if (errMsg.toLowerCase().includes("cors")) {
      return res.status(403).json({
        error: "cors_error",
        message: "Request blocked. Please refresh the page and try again.",
      });
    }
    if (errMsg.toLowerCase().includes("timeout") || errMsg.toLowerCase().includes("timed out")) {
      return res.status(504).json({
        error: "timeout",
        message: "The request timed out. Please try again.",
      });
    }
    if (errMsg.toLowerCase().includes("rate limit") || errMsg.toLowerCase().includes("quota")) {
      return res.status(503).json({
        error: "service_unavailable",
        message: "The service is temporarily busy. Please wait a moment and try again.",
      });
    }
  }

  // Determine if this is an upload or analysis request for a better fallback message
  const isUploadRoute = req.url?.includes("/upload");
  const isAnalyzeRoute = req.url?.includes("/analyze");

  if (isUploadRoute) {
    return res.status(500).json({
      error: "upload_failed",
      message: "Upload failed. Please try again. If the problem continues, try pasting the document text instead.",
    });
  }
  if (isAnalyzeRoute) {
    return res.status(500).json({
      error: "analysis_failed",
      message: "Analysis failed. Please try again. If the problem continues, try pasting a shorter section of your document.",
    });
  }

  return res.status(500).json({
    error: "internal_error",
    message: "Something went wrong. Please try again.",
  });
});

export default app;
