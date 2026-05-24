import { z } from "zod";
import type { $ZodIssue } from "zod/v4/core";

const githubAuthSchema = z.object({
  GITHUB_CLIENT_ID: z.string().min(1, "GitHub Client ID is required"),
  GITHUB_CLIENT_SECRET: z.string().min(1, "GitHub Client Secret is required"),
  GITHUB_REDIRECT_URI: z.url("Invalid Redirect URI format"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

const githubRedirectUri =
  process.env.GITHUB_REDIRECT_URI ?? process.env.GITHUB_CALLBACK_URL;

const parsedEnv = githubAuthSchema.safeParse({
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
  GITHUB_REDIRECT_URI: githubRedirectUri,
  NODE_ENV: process.env.NODE_ENV,
});

if (!parsedEnv.success) {
  console.error(
    "❌ Invalid environment variables:",
    parsedEnv.error.issues.map(
      (issue: $ZodIssue) => `${issue.path.join(".")}: ${issue.message}`,
    ),
  );
  process.exit(1);
}

export const githubAuthConfig = parsedEnv.data;
