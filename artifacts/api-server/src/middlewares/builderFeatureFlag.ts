import type { Request, Response, NextFunction } from "express";

/**
 * Returns HTTP 404 on all /api/builder/* routes when BUILDER_ENABLED is not "true".
 * In non-production environments, defaults to enabled so development works without
 * explicit configuration.
 */
export function requireBuilderEnabled(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  const isProduction = process.env.NODE_ENV === "production";
  const flagValue = process.env.BUILDER_ENABLED;
  const enabled = isProduction ? flagValue === "true" : (flagValue !== "false");

  if (!enabled) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  next();
}
