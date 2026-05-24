import type { Request, NextFunction, Response } from "express";
import type { LoginType } from "../types/type.js";
import { clearSession, getUserByEmail } from "../service/operation.service.js";
import * as argon2 from "argon2";
import { loggingUserSchema } from "../validators/validators.js";
import type { $ZodIssue } from "zod/v4/core";
import { authentication } from "../lib/authentication.js";
import { cookieConfig } from "../lib/cookiesOptions.js";
import { logger } from "../utils/logger.js";

export const getLoginPage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.user) return res.redirect("/");
  try {
    // 200 OK: The standard response for successful HTTP requests
    res.status(200).render("login", {
      message: req.flash("success"),
      error: req.flash("errors") || "",
    });
  } catch (error) {
    logger.error(`❌ Error-getLoginPage: ${error}`);
    next(error);
  }
};

export const postLoginData = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.user) return res.redirect("/");

  try {
    const result = loggingUserSchema.safeParse(req.body as LoginType);

    if (!result.success) {
      req.flash(
        "errors",
        result.error.issues.map((issue: $ZodIssue) => issue.message),
      );
      // 400 Bad Request: The server cannot process the request due to client error (validation)
      return res.status(400).redirect("/auth/login");
    }

    const { email: userEmail, password } = result.data;

    const userExist = await getUserByEmail(userEmail);
    if (!userExist) {
      req.flash("errors", "User does not exist");
      // 401 Unauthorized: Lacks valid authentication credentials
      return res.status(401).redirect("/auth/login");
    }
if (!userExist.password) {
  req.flash("errors", "This account uses Google Sign-In. Please log in with Google.");
  return res.status(400).redirect("/auth/login");
}
    const verifiedPassword = await argon2.verify(userExist.password, password);
    if (!verifiedPassword) {
      req.flash("errors", "Incorrect Password");
      // 401 Unauthorized: Password mismatch
      return res.status(401).redirect("/auth/login");
    }

    const { id: userId, username, email, isEmailValid } = userExist;

    await authentication({ req, res, userId, username, email, isEmailValid });

    // 303 See Other: Redirecting to a new URI after a successful POST
    res.status(303).redirect("/");
  } catch (error) {
    logger.error(`❌ Error-postLoginData: ${(error as Error).message}`);
    next(error); // Express error handler will typically send a 500 Internal Server Error
  }
};
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const sessionId = req.user?.sessionId;

    if (sessionId) {
      await clearSession(Number(sessionId));
    }

    res.clearCookie("access_token", cookieConfig);
    res.clearCookie("refresh_token", cookieConfig);
    return res.redirect(303, "/auth/login");
  } catch (error) {
    logger.error("Logout Error:", error);
    next(error);
    return res
      .status(500)
      .json({ message: "Internal server error during logout" });
  }
};
