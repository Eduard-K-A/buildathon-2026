import { z } from "zod";

export const exerciseTypeSchema = z.enum([
  "multiple_choice",
  "true_false",
  "fill_in_blank",
  "short_answer",
]);

export const difficultySchema = z.enum(["easy", "medium", "hard"]);

export const languageModeSchema = z.enum(["english", "filipino", "taglish"]);
export const languagePreferenceSchema = z.enum(["auto", "english", "filipino", "taglish"]);
export const toneStateSchema = z.enum(["confident", "neutral", "confused", "frustrated"]);

export const documentAnalysisSchema = z.object({
  subject: z.string(),
  detected_topic: z.string(),
  detected_grade_level: z.string(),
  dominant_language: languageModeSchema,
  key_topics: z.array(z.string()).min(3).max(8),
  suggested_exercise_types: z
    .array(z.object({ type: exerciseTypeSchema, reason: z.string() }))
    .min(2)
    .max(3),
});

export const practiceQuestionSchema = z.object({
  id: z.string(),
  type: exerciseTypeSchema,
  prompt: z.string(),
  choices: z.array(z.string()).nullable(),
  correct_answer: z.string(),
  source_reference: z.string().max(100).nullable(),
  hint: z.string(),
  explanation: z.string(),
  topic: z.string(),
});

export const questionsResponseSchema = z.object({
  questions: z.array(practiceQuestionSchema),
});

export const tutorTurnRequestSchema = z.object({
  question: practiceQuestionSchema,
  studentAnswerText: z.string(),
  languagePreference: languagePreferenceSchema.default("auto"),
  conversationHistory: z
    .array(z.object({ role: z.enum(["student", "gabi"]), text: z.string() }))
    .default([]),
  attemptNumber: z.number().int().min(1),
});

export const tutorTurnResultSchema = z.object({
  is_correct: z.boolean(),
  feedback_text: z.string(),
  hint_text: z.string().nullable(),
  detected_tone: toneStateSchema,
  tone_badge_text: z.string().max(80).nullable(),
  reveal_answer: z.boolean(),
  matched_language: languageModeSchema,
});

export const quickChatResultSchema = z.object({
  response: z.string(),
  matched_language: languageModeSchema,
});

export const sessionSummarySchema = z.object({
  score: z.object({ correct: z.number(), total: z.number() }),
  topics_covered: z.array(z.string()),
  weak_areas: z.array(
    z.object({
      topic: z.string(),
      question_ids: z.array(z.string()),
      reason: z.string(),
      source_reference: z.string().nullable(),
    }),
  ),
  encouragement_message: z.string(),
});

export const textSourceRequestSchema = z.object({
  text: z.string().trim().min(1).max(80_000),
});

export const customReviewerSchema = z
  .object({
    focusTopics: z.array(z.string().trim().min(1)).max(8).default([]),
    difficulty: difficultySchema.optional(),
    instructions: z.string().trim().max(500).optional(),
    typeMix: z
      .array(z.object({ type: exerciseTypeSchema, count: z.number().int().min(1) }))
      .optional(),
  })
  .refine(
    (custom) => {
      if (!custom.typeMix) return true;
      const total = custom.typeMix.reduce((sum, item) => sum + item.count, 0);
      return total >= 5 && total <= 15;
    },
    { message: "Question mix must total between 5 and 15 questions." },
  );

export const questionRequestSchema = z.object({
  selectedTypes: z.array(exerciseTypeSchema).min(1),
  questionCount: z.number().int().min(5).max(15),
  languagePreference: languagePreferenceSchema.default("auto"),
  custom: customReviewerSchema.optional(),
});

export const quickChatRequestSchema = z.object({
  message: z.string().trim().min(1).max(1_500),
  languagePreference: languagePreferenceSchema.default("auto"),
  conversationHistory: z
    .array(z.object({ role: z.enum(["student", "gabi"]), text: z.string() }))
    .default([]),
});

export const summaryRequestSchema = z.object({
  sessionResults: z.array(
    z.object({
      questionId: z.string(),
      topic: z.string(),
      correct: z.boolean(),
      attempts: z.number().int().min(0),
      skipped: z.boolean(),
      source_reference: z.string().nullable(),
      detected_tone: toneStateSchema.optional(),
    }),
  ),
  dominantLanguage: languageModeSchema,
  languagePreference: languagePreferenceSchema.default("auto"),
});

export type ExerciseType = z.infer<typeof exerciseTypeSchema>;
export type Difficulty = z.infer<typeof difficultySchema>;
export type CustomReviewer = z.infer<typeof customReviewerSchema>;
export type LanguageMode = z.infer<typeof languageModeSchema>;
export type LanguagePreference = z.infer<typeof languagePreferenceSchema>;
export type ToneState = z.infer<typeof toneStateSchema>;
export type DocumentAnalysis = z.infer<typeof documentAnalysisSchema>;
export type PracticeQuestion = z.infer<typeof practiceQuestionSchema>;
export type TutorTurnResult = z.infer<typeof tutorTurnResultSchema>;
export type QuickChatResult = z.infer<typeof quickChatResultSchema>;
export type SessionSummary = z.infer<typeof sessionSummarySchema>;
