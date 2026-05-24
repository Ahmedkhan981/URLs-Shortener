import type { NextFunction, Request, Response } from "express";
import { forgetPasswordSchema } from "../validators/validators.js";
import { generateOTP, getUserByEmail } from "../service/operation.service.js";
import { generateHTML } from "../lib/generateHTML.js";
import { emailSendToken } from "../lib/emailSendToken.js";
import { verifyEmailSchema } from "../validators/code.validators.js";
import {
  getUserAndResetPasswordToken,
  hashPassword,
  resetPasswordCodeCleanupAndUpdatePasswordAndGetUserData,
  resetPasswordCodeStore,
  verifyPassword,
} from "../service/resetPassword.service.js";
import type { ResetSessionPayload } from "../types/type.js";
import jwt from "jsonwebtoken";
import { resetToken } from "../service/JWT.service.js";
import { cookieConfig } from "../lib/cookiesOptions.js";
import { ACCESS_TOKEN_EXPIRY } from "../date.js";
import { resetPasswordSchema } from "../validators/validators.js";
import { authentication } from "./../lib/authentication.js";
import { logger } from "../utils/logger.js";
import { getBaseUrl } from "../lib/urlDetecter.js";

export const COOKIE_NAME = "reset_session";

export const getResetSession = (req: Request): ResetSessionPayload | null => {
  const raw = req.signedCookies?.[COOKIE_NAME] || req.cookies?.[COOKIE_NAME];

  if (!raw) return null;

  try {
    return jwt.verify(raw, process.env.JWT_SECRET_KEY!) as ResetSessionPayload;
  } catch {
    return null;
  }
};

export const getForgetPasswordPage = (req: Request, res: Response) => {
  res.render("forgot-password", { message: null, error: null });
};

export const postForgetPasswordData = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await forgetPasswordSchema.safeParseAsync(req.body);

    if (!result.success) {
      return res.render("forgot-password", {
        message: null,
        error: result.error.issues[0]?.message || "Invalid input",
      });
    }

    const { email } = result.data;
    const user = await getUserByEmail(email);

    if (!user) {
      return res.status(200).render("verifyEmail", {
        resendRoute: "/auth/resend-code",
        action: "/auth/verify-code",
        userEmail: email,
        message: "If an account exists, a security code has been sent.",
        error: null,
      });
    }

    const newOTP = generateOTP();
    const hashCode = await hashPassword(newOTP);
    await resetPasswordCodeStore(user.id, hashCode);
    const freshData = await getUserAndResetPasswordToken(user.id);
    if (!freshData || !freshData.token) {
      return res.status(500).render("verifyEmail", {
        resendRoute: "/auth/resend-code",
        action: "/auth/verify-code",
        userEmail: user.email,
        error: "Failed to generate security code",
        message: null,
      });
    }

    const { token } = freshData;

    if (token.expiresAt < new Date()) {
      return res.status(410).render("verifyEmail", {
        resendRoute: "/auth/resend-code",
        action: "/auth/verify-code",
        userEmail: user.email, // Use 'user.email' fetched above
        error: "Code has expired. Please request a new one.",
        message: null,
      });
    }

    const emailObject = await generateHTML({
      code: newOTP,
      email: user.email,
      route: "forget-password",
      link: getBaseUrl(req),
    });
    const { isEmailSend } = await emailSendToken(emailObject, user.email);
    if (!isEmailSend) {
      return res.status(500).render("forgot-password", {
        message: null,
        error: "Failed to send email. Please try again.",
      });
    }
    const helperToken = resetToken({
      userId: user.id,
      email: user.email,
      purpose: "password-reset-verify",
    });
    res.cookie(COOKIE_NAME, helperToken, {
      ...cookieConfig,
      maxAge: ACCESS_TOKEN_EXPIRY, // 15 minutes
    });
    return res.status(200).render("verifyEmail", {
      resendRoute: "/auth/resend-code",
      action: "/auth/verify-code",
      userEmail: user.email,
      message: "We have sent a security code to your email.",
      error: null,
    });
  } catch (error) {
    logger.error("Forgot Password Error:", error);
    next(error);
    res.status(500).render("forgot-password", {
      message: null,
      error: "An internal server error occurred. Please try again.",
    });
  }
};

export const postResendForgetPasswordData = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const session = getResetSession(req);
    if (!session) return res.redirect("/auth/forgot-password");

    const newOTP = generateOTP();
    const hashedPassword = await hashPassword(newOTP);
    await resetPasswordCodeStore(session.userId, hashedPassword);

    const emailObject = await generateHTML({
      code: newOTP,
      email: session.email,
      route: "forget-password",
      link: getBaseUrl(req),
    });
    const { isEmailSend } = await emailSendToken(emailObject, session.email);
    if (!isEmailSend) {
      return res.render("verifyEmail", {
        resendRoute: "/auth/resend-code",
        action: "/auth/verify-code",
        userEmail: session.email,
        message: null,
        error: "Failed to resend email. Please try again.",
      });
    }

    const refreshedToken = jwt.sign(
      {
        userId: session.userId,
        email: session.email,
        purpose: "password-reset-verify",
      } satisfies ResetSessionPayload,
      process.env.JWT_SECRET_KEY!,
      { expiresIn: "15m" },
    );
    res.cookie(COOKIE_NAME, refreshedToken, {
      ...cookieConfig,
      maxAge: ACCESS_TOKEN_EXPIRY, // 15 minutes
    });

    return res.status(200).render("verifyEmail", {
      resendRoute: "/auth/resend-code",
      action: "/auth/verify-code",
      userEmail: session.email,
      message: "A new code has been sent to your email.",
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyForgetPasswordData = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const validation = verifyEmailSchema.safeParse({ code: req.body.code });
    if (!validation.success) {
      return res.status(400).render("verifyEmail", {
        resendRoute: "/auth/resend-code",
        action: "/auth/verify-code",
        userEmail: req.user?.email || "",
        error: validation.error.issues[0]?.message || "Invalid code",
        message: null,
      });
    }
    const { code } = validation.data;
    if (!code) {
    }
    const session = getResetSession(req);
    if (!session) return res.redirect("/auth/forgot-password");

    if (session.purpose !== "password-reset-verify") {
      res.clearCookie(COOKIE_NAME);
      return res.status(400).render("verifyEmail", {
        resendRoute: "/auth/resend-code",
        action: "/auth/verify-code",
        userEmail: "",
        error: "Invalid session. Please start again.",
        message: null,
      });
    }

    const storedData = await getUserAndResetPasswordToken(session.userId);

    if (!storedData || !storedData.token) {
      return res.status(400).render("verifyEmail", {
        resendRoute: "/auth/resend-code",
        action: "/auth/verify-code",
        userEmail: session.email,
        error: "No code found. Please request a new one.",
        message: null,
      });
    }
    if (storedData.token.expiresAt < new Date()) {
      return res.status(410).render("verifyEmail", {
        resendRoute: "/auth/resend-code",
        action: "/auth/verify-code",
        userEmail: session.email,
        error: "Code has expired. Please request a new one.",
        message: null,
      });
    }

    const tokenCode = storedData.token.code;
    if (!tokenCode || typeof tokenCode !== "string") {
      return res.status(400).render("verifyEmail", {
        resendRoute: "/auth/resend-code",
        action: "/auth/verify-code",
        userEmail: session.email,
        error: "Invalid OTP data. Please request a new code.",
        message: null,
      });
    }

    const isValid = await verifyPassword(tokenCode, code);

    if (!isValid) {
      return res.status(400).render("verifyEmail", {
        resendRoute: "/auth/resend-code",
        action: "/auth/verify-code",
        userEmail: session.email,
        error: "Invalid code. Please try again.",
        message: null,
      });
    }
    if (isValid) {
      const verifiedToken = resetToken({
        userId: session.userId,
        email: session.email,
        purpose: "password-reset-verify",
      });

      res.cookie(COOKIE_NAME, verifiedToken, {
        ...cookieConfig,
        maxAge: ACCESS_TOKEN_EXPIRY,
      });
      return res.redirect("/auth/reset-password");
    }
  } catch (error) {
    next(error);
    logger.error("Verify Code Error:", error);
  }
};
export const getResetPage = (req: Request, res: Response) => {
  res.render("reset-password", {
    error: [],
    message: [],
  });
};
export const handleResetPage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const validators = await resetPasswordSchema.safeParseAsync(req.body);

    if (!validators.success) {
      return res.render("reset-password", {
        error: [validators.error.issues[0]?.message || "Invalid input"],
        message: [],
      });
    }

    const session = getResetSession(req);

    if (!session || session.purpose !== "password-reset-verify") {
      return res.redirect("/auth/forgot-password");
    }
    const user = await resetPasswordCodeCleanupAndUpdatePasswordAndGetUserData(
      session.userId,
      validators.data.newPassword,
    );
    if (!user) {
      return res.redirect("/auth/register");
    }
    res.clearCookie(COOKIE_NAME);
    await authentication({
      req,
      res,
      email: user.email,
      userId: user.id,
      username: user.username,
      isEmailValid: user.isEmailValid,
    });
    return res.status(303).redirect("/profile");
  } catch (error) {
    next(error);
    res.status(500).render("reset-password", {
      error: ["An unexpected error occurred"],
      message: [],
    });
  }
};
