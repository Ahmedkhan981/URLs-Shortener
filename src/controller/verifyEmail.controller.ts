import type { NextFunction, Request, Response } from "express";
import { verifyEmailSchema } from "../validators/code.validators.js";
import {
  generateOTP,
  getUserAndToken,
  getUserById,
  storeOTP,
  verifyUserEmailAndCleanup
} from "../service/operation.service.js";
import { completeEmailVerification } from "../lib/completeEmailVerification.js";
import type { $ZodIssue } from "zod/v4/core";
import { generateHTML } from "../lib/generateHTML.js";
import { emailSendToken } from "../lib/emailSendToken.js";
import { getBaseUrl } from "../lib/urlDetecter.js";
export const getVerifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) return res.status(401).redirect("/auth/login");

    const result = await getUserAndToken(req.user.id);
    if (!result) return res.status(401).redirect("/auth/login");

    // Already verified? 302/303 to profile
    if (result.user.isEmailValid) return res.status(303).redirect("/profile");

    const { code: queryCode, email: queryEmail } = req.query;

    // --- 1. HANDLING AUTO-VERIFY FROM LINK ---
    if (queryCode && queryEmail) {
      const decodedEmail = decodeURIComponent(queryEmail as string);

      if (decodedEmail !== result.user.email) {
        return res.status(400).render("verifyEmail", {
      
          resendRoute: "/verify/resend-code",
          action: "/verify/verify-email",
          userEmail: result.user.email,
          error: "Email mismatch",
          message: null,
        });
      }

      if (
        !result.token ||
        result.token.code !== queryCode ||
        result.token.expiresAt < new Date()
      ) {
        return res.status(410).render("verifyEmail", {
      
          resendRoute: "/verify/resend-code",
          action: "/verify/verify-email",
          userEmail: result.user.email,
          error: "Invalid or expired code",
          message: null,
        });
      }

      const isSuccess = await verifyUserEmailAndCleanup(result.user.id);
      if (isSuccess) {

        await completeEmailVerification(
          res,
          result.user,
          Number(req.user.sessionId),
        );
        return res.status(303).redirect("/profile");
      } else {
        throw new Error("Verification failed during transaction");
      }
    }

    // --- 2. AUTO-RESEND/GENERATE LOGIC ---
    let emailToken = result.token;
    if (!emailToken || emailToken.expiresAt < new Date()) {
      const newOTP = generateOTP();
      await storeOTP(result.user.id, newOTP);
      const freshData = await getUserAndToken(result.user.id);
      emailToken = freshData?.token || null;
    }
const link = getBaseUrl(req)
    if (emailToken) {
      const emailObject = await generateHTML({
        code: emailToken.code,
        email: result.user.email,
        route: "verify-email",
        link,
      });
      await emailSendToken(emailObject as any, result.user.email);
    }

    // --- 3. MASK EMAIL & RENDER ---
    const [name, domain] = result.user.email.split("@");
    const maskedEmail = name ? `${name.slice(0, 2)}${"*".repeat(Math.max(0, name.length - 2))}@${domain}` : result.user.email;

    return res.status(200).render("verifyEmail", {
  
      resendRoute: "/verify/resend-code",
      action: "/verify/verify-email",
      userEmail: maskedEmail,
      error: null,
      message: "A verification code has been sent to your email.",
    });
  } catch (error) {
    next(error);
  }
};

export const postVerifyEmail = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).redirect("/auth/login");

    const validation = verifyEmailSchema.safeParse({ code: req.body.code });

    if (!validation.success) {
      return res.status(400).render("verifyEmail", {
         
        resendRoute: "/verify/resend-code",
        action: "/verify/verify-email",
        error: validation.error.issues
          .map((i: $ZodIssue) => i.message)
          .join(", "),
        message: null,
        userEmail: req.user.email,
      });
    }

    const result = await getUserAndToken(req.user.id);
    if (!result || !result.user) return res.status(401).redirect("/auth/login");
    if (result.user.isEmailValid) return res.status(303).redirect("/profile");

    const submittedCode = validation.data.code;

    if (
      !result.token ||
      result.token.expiresAt < new Date() ||
      result.token.code !== submittedCode
    ) {
      // 403 Forbidden: Correct code/session but verification logic failed
      return res.status(403).render("verifyEmail", {
        resendRoute: "/verify/resend-code",
        action: "/verify/verify-email",
        error: !result.token
          ? "Invalid code"
          : result.token.expiresAt < new Date()
            ? "Code expired"
            : "Invalid code",
        message: null,
        userEmail: result.user.email,
      });
    }

    await completeEmailVerification(
      res,
      result.user,
      Number(req.user.sessionId),
    );
    return res.status(303).redirect("/profile");
  } catch (error) {
    return res.status(500).render("verifyEmail", {
  
      resendRoute: "/verify/resend-code",
      action: "/verify/verify-email",
      error: "Internal server error",
      message: null,
      userEmail: req.user?.email || "",
    });
  }
};

export const resendVerificationCode = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).redirect("/auth/login");

    const user = await getUserById(req.user.id);
    if (!user || user.isEmailValid)
      return res.status(303).redirect("/");

    const newOTP = generateOTP();
    await storeOTP(user.id, newOTP);

    const freshData = await getUserAndToken(req.user.id);
    const emailToken = freshData?.token;

    if (!emailToken) {
      return res.status(500).render("verifyEmail", {
    
        resendRoute: "/verify/resend-code",
        action: "/verify/verify-email",
        userEmail: user.email,
        error: "Failed to generate code",
        message: null,
      });
    }

    const emailObject = await generateHTML({
      code: emailToken.code,
      email: user.email,
      route: "verify-email",
      link: getBaseUrl(req),
    });
    const emailSent = await emailSendToken(emailObject, user.email);

    if (emailSent.isEmailSend) {
      // 201 Created: Since we created a new OTP resource
      return res.status(201).render("verifyEmail", {
    
        resendRoute: "/verify/resend-code",
        action: "/verify/verify-email",
        userEmail: user.email,
        error: null,
        message: "A fresh verification code has been sent to your email.",
      });
    } else {
      return res.status(502).render("verifyEmail", {
    
        resendRoute: "/verify/resend-code",
        // 502 Bad Gateway: Upstream email provider failed
        action: "/verify/verify-email",
        userEmail: user.email,
        error: "Code generated, but email delivery failed.",
        message: null,
      });
    }
  } catch (error) {
    return res.status(500).render("verifyEmail", {
  
      resendRoute: "/verify/resend-code",
      action: "/verify/verify-email",
      userEmail: req.user?.email || "",
      error: "An unexpected error occurred.",
      message: null,
    });
  }
};