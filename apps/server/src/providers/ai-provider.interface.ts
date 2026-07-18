export type JSONSchema = Record<string, unknown>;

export interface ChatCompletionRequest {
  systemPrompt: string;
  userMessage: string;
  responseSchema: JSONSchema;
  schemaName: string;
  preferFastModel?: boolean;
}

export interface ChatCompletionResult {
  raw: unknown;
  modelUsed: string;
  provider: string;
}

export interface TranscriptionRequest {
  audio: Buffer;
  filename: string;
  maxDurationSeconds: number;
}

export interface TranscriptionResult {
  transcript: string;
  languageHint: string | null;
}

export interface AIProvider {
  readonly name: string;
  chatCompletion(req: ChatCompletionRequest): Promise<ChatCompletionResult>;
  isAvailable(): Promise<boolean>;
}

export interface STTProvider {
  readonly name: string;
  transcribe(req: TranscriptionRequest): Promise<TranscriptionResult>;
}
