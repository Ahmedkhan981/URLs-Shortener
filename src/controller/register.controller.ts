import type { NextFunction, Request, Response } from "express";
import type { RegisterType } from "../types/type.js";
import {
  registerTransaction,
} from "../service/operation.service.js";
import { registerUserSchema } from "../validators/validators.js";
import { authentication } from "../lib/authentication.js";
import { logger } from "../utils/logger.js";
/**
 * Renders the Registration Page
 */
export const getRegisterPage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // If user is already authenticated, don't show the register page
  if (req.user) return res.redirect("/");

  try {
    // 200 OK: Standard successful page render
    res.status(200).render("register", {
      message: null,
      error: req.flash("errors") || [],
    });
  } catch (error) {
    logger.error(`❌ Error-getRegisterPage: ${error}`);
    next(error);
  }
};

/**
 * Handles the Registration Logic
 */
export const postRegisterData = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.user) return res.redirect("/");

  try {
    // 1. Zod Validation
    const result = registerUserSchema.safeParse(req.body as RegisterType);

    if (!result.success) {
      // Professional approach: pass the entire array of messages to flash
      req.flash("errors", result.error.issues.map((issue: { message: string }) => issue.message));
      
      // 400 Bad Request: Validation failed
      return res.status(400).redirect("/auth/register");
    }

    const { username, email, password } = result.data;

    // 2. Database Transaction
    const resultUser = await registerTransaction({ username, email, password });

    if (resultUser.error) {
      req.flash("errors", resultUser.error);
      
      // 409 Conflict: User or Email already exists
      // If the error suggests moving to login, we redirect there
      return res.status(409).redirect("/auth/login");
    }

    // 3. Authenticate (Set Session/Cookies)
    await authentication({
      req,
      res,
      userId: resultUser.user!.id,
      username,
      email,
      isEmailValid: false, // Default for new registration
    });


    return res.status(303).redirect("/verify/verify-email");

  } catch (error) {
    logger.error("❌ Register error:", (error as Error).message);
    req.flash("errors", "Something went wrong. Please try again later.");

    next(error);
  }
};