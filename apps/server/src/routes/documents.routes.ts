import { Router } from "express";
import multer from "multer";
import { textSourceRequestSchema } from "@gabai/shared";
import type { DocumentProcessingService } from "../services/document-processing.service";
import { AppError, asyncRoute } from "../utils/errors";

export function documentsRoutes(documents: DocumentProcessingService) {
  const router = Router();
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

  router.post(
    "/upload",
    upload.single("file"),
    asyncRoute(async (req, res) => {
      const startedAt = Date.now();
      console.log("[documents] upload:start", {
        filename: req.file?.originalname,
        mimetype: req.file?.mimetype,
        bytes: req.file?.size,
      });
      if (!req.file) throw new AppError("FILE_REQUIRED", "Upload a PDF to continue.");
      if (req.file.mimetype !== "application/pdf") {
        throw new AppError("UNSUPPORTED_FILE", "GabAI reads PDFs only for now. Try pasting the text instead.");
      }
      const source = await documents.fromPdf(req.file.buffer);
      console.log("[documents] upload:success", {
        sourceId: source.sourceId,
        charCount: source.charCount,
        durationMs: Date.now() - startedAt,
      });
      res.json({ sourceId: source.sourceId, charCount: source.charCount, preview: source.preview });
    }),
  );

  router.post(
    "/text",
    asyncRoute(async (req, res) => {
      const startedAt = Date.now();
      const parsed = textSourceRequestSchema.parse(req.body);
      console.log("[documents] text:start", { charCount: parsed.text.length });
      const source = documents.storeText(parsed.text);
      console.log("[documents] text:success", {
        sourceId: source.sourceId,
        charCount: source.charCount,
        durationMs: Date.now() - startedAt,
      });
      res.json({ sourceId: source.sourceId, charCount: source.charCount, preview: source.preview });
    }),
  );

  return router;
}
