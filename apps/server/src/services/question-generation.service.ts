import {
  documentAnalysisSchema,
  questionRequestSchema,
  questionsResponseSchema,
  type DocumentAnalysis,
} from "@gabai/shared";
import { z } from "zod";
import type { AIProvider } from "../providers/ai-provider.interface";
import { AppError } from "../utils/errors";
import type { DocumentProcessingService } from "./document-processing.service";

const analysisPrompt = "Analyze the provided study material for GabAI and return strict JSON.";
const questionPrompt = "Generate GabAI practice questions from the provided text and return strict JSON.";

export class QuestionGenerationService {
  constructor(
    private readonly documents: DocumentProcessingService,
    private readonly aiProvider: AIProvider,
  ) {}

  async analyze(sourceId: string): Promise<DocumentAnalysis> {
    const startedAt = Date.now();
    const source = this.documents.get(sourceId);
    console.log("[questions] analyze:source", {
      sourceId,
      charCount: source.charCount,
      promptChars: source.text.slice(0, 24_000).length,
    });

    const result = await this.aiProvider.chatCompletion({
      systemPrompt: analysisPrompt,
      userMessage: source.text.slice(0, 24_000),
      responseSchema: z.toJSONSchema(documentAnalysisSchema),
      schemaName: "document_analysis",
      preferFastModel: true,
    });

    const parsed = documentAnalysisSchema.parse(result.raw);
    console.log("[questions] analyze:parsed", {
      sourceId,
      model: result.modelUsed,
      durationMs: Date.now() - startedAt,
    });
    return parsed;
  }

  async questions(sourceId: string, input: unknown) {
    const startedAt = Date.now();
    const parsed = questionRequestSchema.parse(input);

    const context = this.documents.selectContext(sourceId, parsed.questionCount);
    console.log("[questions] generate:context", {
      sourceId,
      selectedTypes: parsed.selectedTypes,
      questionCount: parsed.questionCount,
      contextChars: context.length,
    });
    const result = await this.aiProvider.chatCompletion({
      systemPrompt: questionPrompt,
      userMessage: JSON.stringify({
        context,
        selectedTypes: parsed.selectedTypes,
        questionCount: parsed.questionCount,
        languageInstruction: languageInstruction(parsed.languagePreference),
      }),
      responseSchema: z.toJSONSchema(questionsResponseSchema),
      schemaName: "question_generation",
    });

    const questions = questionsResponseSchema.parse(result.raw);
    console.log("[questions] generate:parsed", {
      sourceId,
      model: result.modelUsed,
      count: questions.questions.length,
      durationMs: Date.now() - startedAt,
    });
    for (const question of questions.questions) {
      const count = question.source_reference?.split(/\s+/).filter(Boolean).length ?? 0;
      if (count > 15) {
        throw new AppError("INVALID_AI_REFERENCE", "AI returned a source reference that was too long.", 502);
      }
    }
    return questions;
  }
}

function languageInstruction(languagePreference: "auto" | "english" | "filipino" | "taglish") {
  if (languagePreference === "english") {
    return "Write every generated question, choice, answer, hint, explanation, topic, and source-facing text in English.";
  }
  if (languagePreference === "filipino") {
    return "Write every generated question, choice, answer, hint, explanation, topic, and source-facing text in Filipino.";
  }
  if (languagePreference === "taglish") {
    return "Write every generated question, choice, answer, hint, explanation, topic, and source-facing text in natural Taglish.";
  }
  return "Choose the most appropriate response language from the source material and learner context. Use one consistent language mode per question.";
}
