import type { Env } from "../env";
import type {
  AIProvider,
  ChatCompletionRequest,
  ChatCompletionResult,
  STTProvider,
  TranscriptionRequest,
  TranscriptionResult,
} from "./ai-provider.interface";

export class GroqProvider implements AIProvider, STTProvider {
  readonly name = "groq";

  constructor(private readonly env: Env) {}

  async isAvailable(): Promise<boolean> {
    return Boolean(
      this.env.OPENAI_API_KEY &&
        this.env.OPENAI_MODEL_PRIMARY &&
        this.env.OPENAI_MODEL_FAST &&
        this.env.OPENAI_STT_MODEL,
    );
  }

  async chatCompletion(req: ChatCompletionRequest): Promise<ChatCompletionResult> {
    if (!(await this.isAvailable())) {
      throw new Error("Groq provider is not configured.");
    }

    const model = req.preferFastModel ? this.env.OPENAI_MODEL_FAST : this.env.OPENAI_MODEL_PRIMARY;
    const startedAt = Date.now();
    console.log("[groq] chat:start", {
      model,
      schemaName: req.schemaName,
      preferFastModel: req.preferFastModel,
      promptChars: req.userMessage.length,
    });
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: req.systemPrompt },
          { role: "user", content: req.userMessage },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: req.schemaName,
            strict: true,
            schema: req.responseSchema,
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[groq] chat:error", {
        model,
        schemaName: req.schemaName,
        status: response.status,
        statusText: response.statusText,
        durationMs: Date.now() - startedAt,
        body: errorText.slice(0, 2_000),
      });
      throw new Error(`Groq chat request failed with ${response.status}: ${errorText.slice(0, 300)}`);
    }

    const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const rawText = payload.choices?.[0]?.message?.content;
    if (!rawText) {
      console.error("[groq] chat:error", {
        model,
        schemaName: req.schemaName,
        durationMs: Date.now() - startedAt,
        reason: "missing_content",
      });
      throw new Error("Groq response did not include content.");
    }

    try {
      const raw = JSON.parse(rawText);
      console.log("[groq] chat:success", {
        model,
        schemaName: req.schemaName,
        durationMs: Date.now() - startedAt,
      });
      return { raw, modelUsed: model ?? "unknown", provider: this.name };
    } catch (error) {
      console.error("[groq] chat:error", {
        model,
        schemaName: req.schemaName,
        durationMs: Date.now() - startedAt,
        reason: "invalid_json",
        rawText: rawText.slice(0, 2_000),
      });
      throw error;
    }
  }

  async transcribe(req: TranscriptionRequest): Promise<TranscriptionResult> {
    if (!(await this.isAvailable())) {
      throw new Error("Groq provider is not configured.");
    }

    const formData = new FormData();
    formData.append("model", this.env.OPENAI_STT_MODEL ?? "");
    const audio = Uint8Array.from(req.audio);
    formData.append("file", new Blob([audio]), req.filename);

    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.env.OPENAI_API_KEY}` },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Groq transcription failed with ${response.status}`);
    }

    const payload = (await response.json()) as { text?: string; language?: string };
    return { transcript: payload.text ?? "", languageHint: payload.language ?? null };
  }
}
