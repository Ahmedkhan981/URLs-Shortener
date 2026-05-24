import rateLimit from "express-rate-limit";

export const forgetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 5, 
  message: "Too many reset requests. Please try again in an hour.",
  standardHeaders: true,
  legacyHeaders: false,
});
