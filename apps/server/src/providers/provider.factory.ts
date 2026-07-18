import type { Env } from "../env";
import { GroqProvider } from "./groq.provider";

export function createProviders(env: Env) {
  const groq = new GroqProvider(env);
  return { aiProvider: groq, sttProvider: groq };
}
