import { Router, type IRouter } from "express";
import healthRouter from "./health";
import documentsRouter from "./documents/index.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/documents", documentsRouter);

export default router;
