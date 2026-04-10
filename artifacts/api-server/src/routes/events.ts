import { Router } from "express"
import { logger } from "../lib/logger.js"

const router = Router()

router.post("/events", (req, res) => {
  const { event, props, ts } = req.body ?? {}
  if (typeof event === "string") {
    logger.info({ event, props: props ?? {}, ts, ip: req.ip }, "analytics_event")
  }
  res.status(204).end()
})

export default router
