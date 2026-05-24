import z from "zod";
import { loggingUserSchema } from "./logging.validators.js";

export const registerUserSchema = loggingUserSchema.extend({
  username: z
    .string()
    .trim()
    .min(3, { message: "Username must be at least 3 characters long" })
    .max(100, { message: "Username must be at most 100 characters long" }),
 
})