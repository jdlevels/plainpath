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

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        error: "file_too_large",
        message: "File is too large. Maximum allowed size is 20 MB.",
      });
    }
    return res.status(400).json({
      error: "upload_error",
      message: `Upload error: ${err.message}`,
    });
  }
  logger.error({ err }, "Unhandled error");
  return res.status(500).json({
    error: "internal_error",
    message: "An unexpected error occurred. Please try again.",
  });
});

export default app;
