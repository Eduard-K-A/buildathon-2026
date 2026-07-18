import { Router } from "express";
import type { SummaryService } from "../services/summary.service";
import { asyncRoute } from "../utils/errors";

export function sessionsRoutes(summary: SummaryService) {
  const router = Router();

  router.post(
    "/summary",
    asyncRoute(async (req, res) => {
      res.json(await summary.summarize(req.body));
    }),
  );

  return router;
}
