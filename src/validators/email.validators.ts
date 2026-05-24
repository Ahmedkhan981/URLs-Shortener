// validators/email.validators.ts
import { z } from "zod";

export const forgetPasswordSchema = z.object({
  email: z.email("Invalid email address"),
});

export type ForgetPasswordData = z.infer<typeof forgetPasswordSchema>;
