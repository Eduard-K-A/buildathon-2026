import { Router } from "express";
import multer from "multer";
import type { SttService } from "../services/stt.service";
import { asyncRoute } from "../utils/errors";

export function sttRoutes(stt: SttService) {
  const router = Router();
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

  router.post(
    "/",
    upload.single("audio"),
    asyncRoute(async (req, res) => {
      res.json(await stt.transcribe(req.file));
    }),
  );

  return router;
}
