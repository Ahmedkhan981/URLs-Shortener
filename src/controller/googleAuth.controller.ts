// googleAuth.controller.ts
import {
  decodeIdToken,
  generateCodeVerifier,
  generateState,
  Google,
} from "arctic";
import type { Request, Response } from "express";
import {
  googleAuthConfig,
  googleAuthQuerySchema,
} from "../validators/validators.js";
import { cookieConfig } from "../lib/cookiesOptions.js";
import { OAUTH_CODE_EXPIRY } from "../date.js";
import type { $ZodIssue } from "zod/v4/core";
import type { GoogleIDTokenClaims } from "../types/type.js";
import {
  createUserWithOauth,
  getUserWithOauthId,
  linkUserWithOauth,
} from "../service/OAuth.service.js";
import { authentication } from "../lib/authentication.js";
import { updateUserProfilePicture } from "../service/editProfile.service.js";
import { logger } from "../utils/logger.js";

export const google = new Google(
  googleAuthConfig.GOOGLE_CLIENT_ID,
  googleAuthConfig.GOOGLE_CLIENT_SECRET,
  googleAuthConfig.GOOGLE_REDIRECT_URI,
);
function isGoogleClaims(val: unknown): val is GoogleIDTokenClaims {
  return (
    typeof val === "object" && val !== null && "email" in val && "sub" in val
  );
}

export const getGoogleAuth = async (req: Request, res: Response) => {
  // ── Step 1: Validate query params ──────────────────────────────────────────
  const result = googleAuthQuerySchema.safeParse(req.query);
  if (!result.success) {
    req.flash(
      "errors",
      result.error.issues.map((i: $ZodIssue) => i.message),
    );
    return res.redirect("/auth/login");
  }

  const { code, state } = result.data;

  // ── Step 2: Validate CSRF state + code verifier ────────────────────────────
  const storedState =
    req.signedCookies?.google_oauth_state || req.cookies?.google_oauth_state;
  const codeVerifier =
    req.signedCookies?.google_code_verifier ||
    req.cookies?.google_code_verifier;

  if (
    !storedState ||
    !codeVerifier ||
    !state ||
    !code ||
    state !== storedState
  ) {
    req.flash("errors", "Invalid session or state mismatch. Please try again.");
    return res.redirect("/auth/login");
  }

  // ── Step 3: Clear OAuth cookies immediately after consuming them ───────────
  res.clearCookie("google_oauth_state");
  res.clearCookie("google_code_verifier");

  // ── Step 4: Exchange code for token ───────────────────────────────────────
  let token;
  try {
    token = await google.validateAuthorizationCode(code, codeVerifier);
  } catch {
    req.flash(
      "errors",
      "Failed to validate authorization code. Please try again.",
    );
    return res.redirect("/auth/login");
  }

  // ── Step 5: Decode ID token claims ────────────────────────────────────────
  const raw = decodeIdToken(token.idToken());
  if (!isGoogleClaims(raw)) {
    req.flash("errors", "Invalid token claims.");
    return res.redirect("/auth/login");
  }
  // console.log("Google ID Token Claims:", raw);
  const { email, name, sub: googleUserId, email_verified, picture } = raw;

  // ── Step 6: Look up existing user ─────────────────────────────────────────
  let user;
  try {
    user = await getUserWithOauthId({ email, provider: "google" });
  } catch {
    req.flash("errors", "A database error occurred. Please try again.");
    return res.redirect("/auth/login");
  }

  // ── Step 7a: New user — create account + authenticate ─────────────────────
  if (!user) {
    let newUser;
    try {
      newUser = await createUserWithOauth({
        email,
        name,
        provider: "google",
        providerAccountId: googleUserId,
        isEmailVerified: email_verified,
        profilePicture: picture,
      });
    } catch {
      req.flash("errors", "Failed to create your account. Please try again.");
      return res.redirect("/auth/login");
    }

    try {
      await authentication({
        req,
        res,
        email,
        isEmailValid: email_verified,
        userId: newUser.id,
        username: newUser.username,
      });
    } catch {
      req.flash("errors", "Authentication failed. Please try again.");
      return res.redirect("/auth/login");
    }

    return res.redirect("/");
  }

  // ── Step 7b: Existing user — link OAuth if not linked yet ─────────────────
  if (!user.oauth_accounts?.providerAccountId) {
    try {
      await linkUserWithOauth({
        userId: user.users.id,
        provider: "google",
        providerAccountId: googleUserId,
      });
    } catch {
      req.flash(
        "errors",
        "Failed to link your Google account. Please try again.",
      );
      return res.redirect("/auth/login");
    }
  }
  try {
    if (
      picture &&
      user.users.profilePicture !== picture &&
      !user.users.profilePicture?.startsWith("/uploads/")
    ) {
      try {
        await updateUserProfilePicture(picture, user.users.id);
        user.users.profilePicture = picture;
      } catch (imgError) {

        logger.warn(
          `Failed to sync Google profile picture for user ${user.users.id}:`,
          imgError,
        );
      }
    }

    await authentication({
      req,
      res,
      email,
      isEmailValid: email_verified,
      userId: user.users.id,
      username: user.users.username,
    });
  } catch {
    req.flash("errors", "Authentication failed. Please try again.");
    return res.redirect("/auth/login");
  }

  return res.redirect("/");
};

// ── Google Login Initiator ─────────────────────────────────────────────────
export const getGoogleLoginPage = async (req: Request, res: Response) => {
  if (req.user) {
    return res.redirect("/");
  }

  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const scopes = ["openid", "profile", "email"];

  const url = google.createAuthorizationURL(state, codeVerifier, scopes);

  res.cookie("google_oauth_state", state, {
    ...cookieConfig,
    maxAge: OAUTH_CODE_EXPIRY, // 10 minutes
  });

  res.cookie("google_code_verifier", codeVerifier, {
    ...cookieConfig,
    maxAge: OAUTH_CODE_EXPIRY,
  });

  return res.redirect(url.toString());
};
