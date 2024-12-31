import { z } from "zod";

const envSchema = z.object({
  AWS_REGION: z.string(),
  AWS_BUCKET: z.string(),
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
});

export const env = envSchema.parse(process.env);
