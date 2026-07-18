import cors from "cors";
import express from "express";
import { env } from "./env";
import { createProviders } from "./providers/provider.factory";
import { documentsRoutes } from "./routes/documents.routes";
import { sessionsRoutes } from "./routes/sessions.routes";
import { sttRoutes } from "./routes/stt.routes";
import { tutorRoutes } from "./routes/tutor.routes";
import { DocumentProcessingService } from "./services/document-processing.service";
import { QuestionGenerationService } from "./services/question-generation.service";
import { SttService } from "./services/stt.service";
import { SummaryService } from "./services/summary.service";
import { TutorTurnService } from "./services/tutor-turn.service";
import { errorHandler } from "./utils/errors";

const app = express();
const { aiProvider, sttProvider } = createProviders(env);

const documents = new DocumentProcessingService();
const questions = new QuestionGenerationService(documents, aiProvider);
const tutor = new TutorTurnService(aiProvider);
const summary = new SummaryService(aiProvider);
const stt = new SttService(sttProvider);

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.get("/health", (_req, res) => res.json({ ok: true, provider: aiProvider.name }));
app.use("/api/source", documentsRoutes(documents));
app.use("/api", tutorRoutes(questions, tutor));
app.use("/api/sessions", sessionsRoutes(summary));
app.use("/api/stt", sttRoutes(stt));
app.use(errorHandler);

const available = await aiProvider.isAvailable();
if (!available) {
  throw new Error(`Configured AI provider "${aiProvider.name}" is not available. Check environment variables.`);
}

app.listen(env.PORT, () => {
  console.log(`GabAI server listening on http://localhost:${env.PORT}`);
});
