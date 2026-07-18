import { sessionSummarySchema, summaryRequestSchema } from "@gabai/shared";
import { z } from "zod";
import type { AIProvider } from "../providers/ai-provider.interface";

export class SummaryService {
  constructor(private readonly aiProvider: AIProvider) {}

  async summarize(input: unknown) {
    const parsed = summaryRequestSchema.parse(input);

    const result = await this.aiProvider.chatCompletion({
      systemPrompt: "Summarize the completed GabAI tutoring session. Return strict JSON.",
      userMessage: JSON.stringify({
        ...parsed,
        languageInstruction: languageInstruction(parsed.languagePreference),
      }),
      responseSchema: z.toJSONSchema(sessionSummarySchema),
      schemaName: "session_summary",
      preferFastModel: true,
    });
    return sessionSummarySchema.parse(result.raw);
  }
}

function languageInstruction(languagePreference: "auto" | "english" | "filipino" | "taglish") {
  if (languagePreference === "english") {
    return "Write the session summary, topics, weak-area reasons, and encouragement in English.";
  }
  if (languagePreference === "filipino") {
    return "Write the session summary, topics, weak-area reasons, and encouragement in Filipino.";
  }
  if (languagePreference === "taglish") {
    return "Write the session summary, topics, weak-area reasons, and encouragement in natural Taglish.";
  }
  return "Use the dominant language from the session summary request.";
}
