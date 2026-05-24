import { generateState, GitHub } from "arctic";
import type { Request, Response } from "express";
import {
  githubAuthConfig,
  githubAuthQuerySchema,
} from "../validators/validators.js";
import { cookieConfig } from "../lib/cookiesOptions.js";
import { OAUTH_CODE_EXPIRY } from "../date.js";
import type { GitHubEmail, GitHubUser } from "../types/type.js";
import { authentication } from "../lib/authentication.js";
import {
  createUserWithOauth,
  getUserWithOauthId,
  linkUserWithOauth,
} from "../service/OAuth.service.js";
import { logger } from "../utils/logger.js";
import { updateUserProfilePicture } from "../service/editProfile.service.js";
const github = new GitHub(
  githubAuthConfig.GITHUB_CLIENT_ID,
  githubAuthConfig.GITHUB_CLIENT_SECRET,
  githubAuthConfig.GITHUB_REDIRECT_URI,
);

function isGitHubUser(val: unknown): val is GitHubUser {
  return (
    typeof val === "object" &&
    val !== null &&
    "login" in val &&
    typeof (val as GitHubUser).login === "string" &&
    "id" in val &&
    typeof (val as GitHubUser).id === "number"
  );
}

function isGitHubEmail(val: unknown): val is GitHubEmail[] {
  return (
    Array.isArray(val) &&
    val.every(
      (item: unknown) =>
        typeof item === "object" &&
        item !== null &&
        "email" in item &&
        typeof (item as GitHubEmail).email === "string" &&
        "primary" in item &&
        typeof (item as GitHubEmail).primary === "boolean" &&
        "verified" in item &&
        typeof (item as GitHubEmail).verified === "boolean",
    )
  );
}
export const getGithubAuth = async (req: Request, res: Response) => {
  const result = githubAuthQuerySchema.safeParse(req.query);

  if (!result.success) {
    req.flash(
      "errors",
      result.error.issues.map((i: { message: string }) => i.message),
    );
    return res.redirect("/auth/login");
  }

  const { code, state } = result.data;
  const storedState =
    req.cookies.github_oauth_state || req.signedCookies.github_oauth_state;

  if (!state || !code || !storedState || state !== storedState) {
    req.flash("errors", ["Invalid state parameter"]);
    return res.redirect("/auth/login");
  }

  res.clearCookie("github_oauth_state");

  try {
    const tokens = await github.validateAuthorizationCode(code);
    const accessToken = tokens.accessToken();

    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "Bun-App",
      },
    });

    if (!userResponse.ok) throw new Error("Failed to fetch user info");

    const githubUserData: unknown = await userResponse.json();

    if (!isGitHubUser(githubUserData)) {
      req.flash("errors", ["Invalid user data received from GitHub"]);
      return res.redirect("/auth/login");
    }

    const githubUserIdStr = githubUserData.id.toString();
    let userEmail = githubUserData.email;
    let isEmailVerified = false;

    // Fetch Emails if primary profile email is null
    if (!userEmail) {
      const emailResponse = await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "Bun-App", // FIX 2: Added missing User-Agent
        },
      });

      if (emailResponse.ok) {
        const rawEmails: unknown = await emailResponse.json();

        if (isGitHubEmail(rawEmails)) {
          const primary = rawEmails.find((e) => e.primary) ?? rawEmails[0];
          userEmail = primary?.email ?? null;
          isEmailVerified = primary?.verified ?? false;
        }
      }
    }

    if (!userEmail) {
      req.flash("errors", ["Could not retrieve an email address from GitHub"]);
      return res.redirect("/auth/login");
    }

    let user;
    try {
      user = await getUserWithOauthId({ email: userEmail, provider: "github" });
    } catch (error) {
      req.flash("errors", ["Database error occurred."]);
      return res.redirect("/auth/login");
    }

    // New User Path
    if (!user) {
      const newUser = await createUserWithOauth({
        email: userEmail,
        name: githubUserData.name || githubUserData.login,
        provider: "github",
        providerAccountId: githubUserIdStr,
        isEmailVerified: isEmailVerified,
        profilePicture: githubUserData.avatar_url,
      });

      await authentication({
        req,
        res,
        email: userEmail,
        isEmailValid: isEmailVerified,
        userId: newUser.id,
        username: newUser.username,
      });

      return res.redirect("/");
    }

    // Existing User Path - Link if missing
    if (!user.oauth_accounts?.providerAccountId) {
      await linkUserWithOauth({
        userId: user.users.id,
        provider: "github",
        providerAccountId: githubUserIdStr,
      });
    }

    // PROFILE PICTURE SYNC
    if (
      githubUserData.avatar_url &&
      user.users.profilePicture !== githubUserData.avatar_url &&
      !user.users.profilePicture?.startsWith("/uploads/")
    ) {
      try {
        await updateUserProfilePicture(
          githubUserData.avatar_url,
          user.users.id,
        );
        user.users.profilePicture = githubUserData.avatar_url;
      } catch (imgError) {
        logger.warn(
          `Failed to sync GitHub profile picture for user ${user.users.id}:`,
          imgError,
        );
      }
    }

    // Authenticate
    await authentication({
      req,
      res,
      email: userEmail,
      isEmailValid: user.users.isEmailValid,
      userId: user.users.id,
      username: user.users.username,
    });

    return res.redirect("/");
  } catch (error: any) {
    logger.error("Auth Error:", error.message);
    req.flash("errors", ["Authentication failed"]);
    return res.redirect("/auth/login");
  }
};

export const getGithubLoginPage = async (req: Request, res: Response) => {
  if (req.user) return res.redirect("/");

  const state = generateState();
  const scopes = ["user:email"];
  const url = github.createAuthorizationURL(state, scopes);

  res.cookie("github_oauth_state", state, {
    ...cookieConfig,
    maxAge: OAUTH_CODE_EXPIRY,
  });

  res.redirect(url.toString());
};
