import type {
  DocumentAnalysis,
  ExerciseType,
  LanguageMode,
  LanguagePreference,
  PracticeQuestion,
  QuickChatResult,
  SessionSummary,
  ToneState,
  TutorTurnResult,
} from "@gabai/shared";
import { apiPost, apiPostForm } from "./client";

export type SourceResponse = {
  sourceId: string;
  charCount: number;
  preview: string;
};

export type SessionResult = {
  questionId: string;
  topic: string;
  correct: boolean;
  attempts: number;
  skipped: boolean;
  source_reference: string | null;
  detected_tone?: ToneState;
};

export type ChatMessage = {
  role: "student" | "gabi";
  text: string;
};

export async function createTextSource(text: string) {
  return apiPost<SourceResponse>("/api/source/text", { text });
}

export async function uploadSource(file: File) {
  const form = new FormData();
  form.append("file", file, file.name);
  return apiPostForm<SourceResponse>("/api/source/upload", form);
}

export async function analyzeSource(sourceId: string) {
  return apiPost<DocumentAnalysis>(`/api/source/${sourceId}/analyze`, {});
}

export async function generateQuestions(
  sourceId: string,
  selectedTypes: ExerciseType[],
  questionCount: number,
  languagePreference: LanguagePreference,
) {
  return apiPost<{ questions: PracticeQuestion[] }>(`/api/source/${sourceId}/questions`, {
    selectedTypes,
    questionCount,
    languagePreference,
  });
}

export async function submitTutorTurn(input: {
  question: PracticeQuestion;
  studentAnswerText: string;
  conversationHistory?: ChatMessage[];
  attemptNumber: number;
  languagePreference: LanguagePreference;
}) {
  return apiPost<TutorTurnResult>("/api/tutor/turn", input);
}

export async function quickChat(message: string, conversationHistory: ChatMessage[], languagePreference: LanguagePreference) {
  return apiPost<QuickChatResult>("/api/tutor/quick-chat", { message, conversationHistory, languagePreference });
}

export async function summarizeSession(
  sessionResults: SessionResult[],
  dominantLanguage: LanguageMode,
  languagePreference: LanguagePreference,
) {
  return apiPost<SessionSummary>("/api/sessions/summary", {
    sessionResults,
    dominantLanguage,
    languagePreference,
  });
}

export async function transcribeAudio(blob: Blob, filename: string) {
  const form = new FormData();
  form.append("audio", blob, filename);
  return apiPostForm<{ transcript: string; languageHint: string | null }>("/api/stt", form);
}
