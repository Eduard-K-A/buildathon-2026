import { Router } from "express";
import type { QuestionGenerationService } from "../services/question-generation.service";
import type { TutorTurnService } from "../services/tutor-turn.service";
import { asyncRoute } from "../utils/errors";

export function tutorRoutes(questions: QuestionGenerationService, tutor: TutorTurnService) {
  const router = Router();

  router.post(
    "/source/:sourceId/analyze",
    asyncRoute(async (req, res) => {
      const startedAt = Date.now();
      const sourceId = String(req.params.sourceId);
      console.log("[tutor] analyze:start", { sourceId });
      const analysis = await questions.analyze(sourceId);
      console.log("[tutor] analyze:success", {
        sourceId,
        subject: analysis.subject,
        topic: analysis.detected_topic,
        durationMs: Date.now() - startedAt,
      });
      res.json(analysis);
    }),
  );

  router.post(
    "/source/:sourceId/questions",
    asyncRoute(async (req, res) => {
      const startedAt = Date.now();
      const sourceId = String(req.params.sourceId);
      console.log("[tutor] questions:start", {
        sourceId,
        selectedTypes: req.body?.selectedTypes,
        questionCount: req.body?.questionCount,
      });
      const generated = await questions.questions(sourceId, req.body);
      console.log("[tutor] questions:success", {
        sourceId,
        count: generated.questions.length,
        durationMs: Date.now() - startedAt,
      });
      res.json(generated);
    }),
  );

  router.post(
    "/tutor/turn",
    asyncRoute(async (req, res) => {
      res.json(await tutor.turn(req.body));
    }),
  );

  router.post(
    "/tutor/quick-chat",
    asyncRoute(async (req, res) => {
      res.json(await tutor.quickChat(req.body));
    }),
  );

  return router;
}
