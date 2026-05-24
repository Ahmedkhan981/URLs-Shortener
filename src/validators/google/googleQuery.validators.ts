import { z } from "zod";

export const googleAuthQuerySchema = z.object({
  code: z.string().min(1, "Code is required"),
  state: z.string().min(1, "State is required"),
});
