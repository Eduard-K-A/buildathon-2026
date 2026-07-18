import crypto from "node:crypto";
import { PDFParse } from "pdf-parse";
import { AppError } from "../utils/errors";

export type SourceText = {
  sourceId: string;
  text: string;
  charCount: number;
  preview: string;
  chunks: Array<{ id: string; text: string; section: string }>;
};

export class DocumentProcessingService {
  private readonly sources = new Map<string, SourceText>();

  async fromPdf(buffer: Buffer) {
    const parser = new PDFParse({ data: buffer });
    try {
      const parsed = await parser.getText();
      return this.storeText(parsed.text);
    } finally {
      await parser.destroy();
    }
  }

  storeText(text: string): SourceText {
    const normalized = text.replace(/\s+/g, " ").trim();
    if (!normalized) {
      throw new AppError("EMPTY_SOURCE", "Couldn't find readable text in that file.");
    }

    const sourceId = crypto.createHash("sha1").update(normalized).digest("hex").slice(0, 16);
    const source: SourceText = {
      sourceId,
      text: normalized,
      charCount: normalized.length,
      preview: normalized.slice(0, 240),
      chunks: this.chunk(normalized),
    };
    this.sources.set(sourceId, source);
    return source;
  }

  get(sourceId: string) {
    const source = this.sources.get(sourceId);
    if (!source) {
      throw new AppError("SOURCE_NOT_FOUND", "That source is no longer available.", 404);
    }
    return source;
  }

  selectContext(sourceId: string, questionCount: number) {
    const source = this.get(sourceId);
    if (source.text.length < 32_000) return source.text;
    return source.chunks.slice(0, Math.max(1, questionCount * 2)).map((chunk) => chunk.text).join("\n\n");
  }

  private chunk(text: string) {
    const paragraphs = text.split(/\n{2,}|(?<=\.)\s+(?=[A-Z])/);
    const chunks: Array<{ id: string; text: string; section: string }> = [];
    let current = "";

    for (const paragraph of paragraphs) {
      if ((current + " " + paragraph).split(/\s+/).length > 700 && current) {
        chunks.push({ id: `chunk-${chunks.length + 1}`, text: current.trim(), section: `Section ${chunks.length + 1}` });
        current = paragraph;
      } else {
        current += `${current ? " " : ""}${paragraph}`;
      }
    }

    if (current.trim()) {
      chunks.push({ id: `chunk-${chunks.length + 1}`, text: current.trim(), section: `Section ${chunks.length + 1}` });
    }

    return chunks;
  }
}
