import { createLogger, format, transports, Logger } from "winston";
import fs from "fs";

const { combine, timestamp, printf, colorize, errors } = format;

// create logs folder ONLY locally
if (process.env.NODE_ENV !== "production") {
  if (!fs.existsSync("logs")) {
    fs.mkdirSync("logs");
  }
}

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${stack || message}`;
});

const isVercel = process.env.VERCEL === "1";

export const logger: Logger = createLogger({
  level: process.env.NODE_ENV === "development" ? "debug" : "info",

  format: combine(
    errors({ stack: true }),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    colorize(),
    logFormat,
  ),

  transports: [
    new transports.Console(),

    // ❌ Disable file logging on Vercel
    ...(isVercel
      ? []
      : [
          new transports.File({
            filename: "logs/error.log",
            level: "error",
          }),
          new transports.File({
            filename: "logs/combined.log",
          }),
        ]),
  ],
});
