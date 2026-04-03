import { Router, type IRouter } from "express";
import healthRouter from "./health";
import documentsRouter from "./documents/index.js";
import pilotFeedbackRouter from "./pilot-feedback.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/documents", documentsRouter);
router.use("/", pilotFeedbackRouter);

export default router;
