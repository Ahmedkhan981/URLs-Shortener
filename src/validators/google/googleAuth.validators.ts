import { z } from "zod";
import type { $ZodIssue } from "zod/v4/core";

const googleAuthSchema = z.object({
  GOOGLE_CLIENT_ID: z.string().min(1, "Google Client ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "Google Client Secret is required"),
  GOOGLE_REDIRECT_URI: z.url("Invalid Redirect URI format"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

const googleRedirectUri =
  process.env.GOOGLE_REDIRECT_URI ?? process.env.GOOGLE_CALLBACK_URL;

const parsedEnv = googleAuthSchema.safeParse({
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI: googleRedirectUri,
  NODE_ENV: process.env.NODE_ENV,
});

if (!parsedEnv.success) {
  console.error(
    "❌ Invalid environment variables:",
    parsedEnv.error.issues.map((issue: $ZodIssue) => issue.message),
  );
  process.exit(1);
}

export const googleAuthConfig = parsedEnv.data;
