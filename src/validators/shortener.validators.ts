import z from "zod";

export const shortenerSchema = z.object({
  originalUrl: z.url("Must be a valid URL").trim(),
  shortUrl: z.string().optional(),
});

export const idSchema = z.coerce.number().int().positive();