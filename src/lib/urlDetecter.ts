import type { Request } from "express";

export const getBaseUrl = (req: Request) => {
  const protocol = req.headers["x-forwarded-proto"]?.toString() || req.protocol;
  const host = req.get("host");
  return `${protocol}://${host}`;
};
