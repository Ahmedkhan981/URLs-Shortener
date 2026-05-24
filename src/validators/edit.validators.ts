import { z } from "zod";

export const passwordSchema = z
  .object({
    currentPassword: z
      .string()
      .trim()
      .min(6, { message: "Current password is required (min 6 chars)" }),
    newPassword: z
      .string()
      .trim()
      .min(6, { message: "New password must be at least 6 characters long" })
      .max(20, { message: "New password must be at most 20 characters long" }),
    confirmPassword: z.string().trim(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"], // This sets the error to the confirmPassword field specifically
  });
export type PasswordSchemaType = z.infer<typeof passwordSchema>;
export const nameSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, { message: "Username must be at least 3 characters long" })
    .max(50, { message: "Username must be at most 50 characters long" }),
});
export type NameSchemaType = z.infer<typeof nameSchema>;