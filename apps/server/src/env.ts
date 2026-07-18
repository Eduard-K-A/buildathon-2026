import "dotenv/config";
import { z } from "zod";

const credentialSchema = z
  .string()
  .trim()
  .min(1)
  .refine((value) => !value.startsWith("your_"), "Replace placeholder values with real credentials.");

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  AI_PROVIDER: z.literal("groq"),
  GROQ_API_KEY: credentialSchema,
  GROQ_MODEL_PRIMARY: credentialSchema,
  GROQ_MODEL_FAST: credentialSchema,
  GROQ_STT_MODEL: credentialSchema,
  SESSION_TTL_MINUTES: z.coerce.number().default(30),
});

export type Env = z.infer<typeof envSchema>;
export const env = envSchema.parse(process.env);
