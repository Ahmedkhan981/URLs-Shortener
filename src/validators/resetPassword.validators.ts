import { z } from "zod";

export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .trim()
      .min(6, { message: "New password must be at least 6 characters long" })
      .max(20, { message: "New password must be at most 20 characters long" }),
    confirmPassword: z.string().trim(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"], 
  });
export type resetPasswordSchemaType = z.infer<typeof resetPasswordSchema>;