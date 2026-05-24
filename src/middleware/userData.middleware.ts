import type { NextFunction, Request, Response } from "express";

export const userData = async (req: Request, res: Response, next: NextFunction) => {
  res.locals.user = req.user || null;
  next();
};
