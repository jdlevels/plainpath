import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import healthRouter from "./health";
import documentsRouter from "./documents/index.js";
import pilotFeedbackRouter from "./pilot-feedback.js";
import waitlistRouter from "./waitlist.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/documents", documentsRouter);
router.use("/", waitlistRouter);

// Pilot feedback routes are internal-only.
// Gate them behind X-Internal-Token header matching INTERNAL_API_TOKEN env var.
// If INTERNAL_API_TOKEN is not configured, all /pilot-feedback/* routes return 404.
function internalOnlyPaths(req: Request, res: Response, next: NextFunction) {
  if (!req.path.startsWith("/pilot-feedback")) return next()
  const token = process.env.INTERNAL_API_TOKEN
  if (!token) return res.status(404).json({ error: "Not found" })
  const provided = req.headers["x-internal-token"]
  if (provided !== token) return res.status(404).json({ error: "Not found" })
  return next()
}

router.use("/", internalOnlyPaths, pilotFeedbackRouter);

export default router;
