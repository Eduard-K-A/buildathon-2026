import {
  quickChatRequestSchema,
  quickChatResultSchema,
  tutorTurnRequestSchema,
  tutorTurnResultSchema,
} from "@gabai/shared";
import { z } from "zod";
import type { AIProvider } from "../providers/ai-provider.interface";

export class TutorTurnService {
  constructor(private readonly aiProvider: AIProvider) {}

  async turn(input: unknown) {
    const parsed = tutorTurnRequestSchema.parse(input);

    const result = await this.aiProvider.chatCompletion({
      systemPrompt: "You are GabAI, a warm and patient AI tutor. Return strict JSON.",
      userMessage: JSON.stringify({
        ...parsed,
        languageInstruction: languageInstruction(parsed.languagePreference),
      }),
      responseSchema: z.toJSONSchema(tutorTurnResultSchema),
      schemaName: "tutor_turn",
      preferFastModel: parsed.attemptNumber < 2,
    });
    return tutorTurnResultSchema.parse(result.raw);
  }

  async quickChat(input: unknown) {
    const parsed = quickChatRequestSchema.parse(input);

    const result = await this.aiProvider.chatCompletion({
      systemPrompt: "You are GabAI in quick chat mode. Return strict JSON.",
      userMessage: JSON.stringify({
        ...parsed,
        languageInstruction: languageInstruction(parsed.languagePreference),
      }),
      responseSchema: z.toJSONSchema(quickChatResultSchema),
      schemaName: "quick_chat",
      preferFastModel: true,
    });
    return quickChatResultSchema.parse(result.raw);
  }
}

function languageInstruction(languagePreference: "auto" | "english" | "filipino" | "taglish") {
  if (languagePreference === "english") {
    return "Respond only in English.";
  }
  if (languagePreference === "filipino") {
    return "Respond only in Filipino.";
  }
  if (languagePreference === "taglish") {
    return "Respond in natural Taglish.";
  }
  return "Match the learner's language when clear; otherwise use the most helpful language for the context.";
}
