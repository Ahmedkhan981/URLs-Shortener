import type{ Request, Response, NextFunction } from "express";
import { logger } from './../utils/logger.js';

const error= (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
logger.error("❌ Error-middleware:", err.message);

  // CRITICAL: Check if headers were already sent to the client
  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};
export default error;
