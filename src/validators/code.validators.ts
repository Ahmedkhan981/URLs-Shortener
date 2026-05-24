import z from "zod";
export const verifyEmailSchema = z
  .object({
    code: z
      .string()
      .regex(/^\d{8}$/, "Code must be 8 digits")
  })
  .refine((data) => data.code !== undefined && data.code !== null, {
    message: "Code is required",
  });
