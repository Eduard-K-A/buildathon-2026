import type { STTProvider } from "../providers/ai-provider.interface";
import { AppError } from "../utils/errors";

export class SttService {
  constructor(private readonly sttProvider: STTProvider) {}

  async transcribe(file?: Express.Multer.File) {
    if (!file) {
      throw new AppError("AUDIO_REQUIRED", "No audio file was uploaded.");
    }

    return this.sttProvider.transcribe({
      audio: file.buffer,
      filename: file.originalname || "answer.m4a",
      maxDurationSeconds: 30,
    });
  }
}
