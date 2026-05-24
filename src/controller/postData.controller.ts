import type { NextFunction, Request, Response } from "express";
import {
  deleteUrl,
  existingURL,
  getOriginalURL,
  getUserById,
  getUserByIdJoinUserRelateUrl,
  storeShortURL,
  updateUrl,
} from "../service/operation.service.js";
import { nanoid } from "nanoid";
import {
  idSchema,
  nameSchema,
  passwordSchema,
  resetPasswordSchema,
  shortenerSchema,
} from "../validators/validators.js";
import type { accessTokenPayLoad } from "../types/type.js";
import {
  updateUserName,
  updateUserPassword,
  updateUserProfilePicture,
  verifyCurrentPassword,
} from "../service/editProfile.service.js";

import { authentication } from "../lib/authentication.js";
import * as argon2 from "argon2";
import { logger } from "../utils/logger.js";
import { getBaseUrl } from "../lib/urlDetecter.js";
import path from "node:path";
import  fs  from 'fs/promises';


export const postData = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = (req.user as { id: number }) || {};

    if (!id) {
      req.flash("error", "Unauthorized user");

      return res.redirect("/auth/login");
    }

    const user = await getUserById(id);

    const urlString = req.body.url?.originalUrl;

    const result = shortenerSchema.safeParse({
      originalUrl: urlString,
    });

    if (!result.success) {
      req.flash(
        "error",
        result.error.issues.map((issue) => issue.message),
      );

      return res.redirect("/");
    }

    const { originalUrl } = result.data;

    const existURL = await existingURL(originalUrl);

    const baseUrl = getBaseUrl(req);

    if (existURL) {
      return res.status(200).render("from", {
        user,
        message: "URL already shortened",
        shortUrl: existURL,
        origin: baseUrl,
      });
    }

    const shortUrl = nanoid(8);

    await storeShortURL(originalUrl, shortUrl, id);

    return res.status(201).render("from", {
      user,
      message: "URL shortened successfully",
      shortUrl,
      origin: baseUrl,
    });
  } catch (error) {
    logger.error("❌ Error-postData:", error);

    next(error);
  }
};

export const redirect = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { shortUrl } = req.params;
    if (!shortUrl) return next();

    const originalUrl = await getOriginalURL(shortUrl as string);
    if (originalUrl) {
      // 301 Moved Permanently is best for SEO and performance in redirects
      return res.status(301).redirect(originalUrl);
    } else {
      return next();
    }
  } catch (error) {
    logger.error(`❌ Error-redirect: ${error}`);
    next(error);
  }
};

/**
 * PAGES & ANALYTICS
 */

export const home = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.redirect("/auth/login");
  }

  const baseUrl = getBaseUrl(req);

  const user = await getUserById((req.user as accessTokenPayLoad).id);

  return res.status(200).render("from", {
    user,
    message: "",
    shortUrl: "",
    origin: baseUrl,
  });
};


export const userUrlData = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) return res.status(401).redirect("/auth/login");

    const sessionUser = req.user as accessTokenPayLoad;
    const result = await getUserByIdJoinUserRelateUrl(sessionUser.id);

    if (!result || result.length === 0 || !result[0]?.user) {
      req.flash("error", "User data not found");
      return res.status(404).redirect("/");
    }

    const user = result[0].user;
    const urls = result
      .map((item) => item.url)
      .filter((u): u is NonNullable<typeof u> => !!u);

    res.status(200).render("analytics", {
      user,
      analytics: urls,
      email: user.isEmailValid,
      message: urls.length === 0 ? "No URLs found yet" : undefined,
      id: user.id,

    });
  } catch (error) {
    logger.error(`❌ Error-userUrlData: ${error}`);
    next(error);
  }
};

/**
 * API OPERATIONS (AJAX/Fetch)
 */

export const updateShortener = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  try {
    const parsed = idSchema.safeParse(req.params.id);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const { shortUrl, originalUrl } = req.body;

    // Check if body data exists
    if (!shortUrl || !originalUrl) {
      return res.status(400).json({ error: "Missing fields" });
    }

    await updateUrl(Number(parsed.data), shortUrl, originalUrl);

    return res.status(200).json({ message: "Updated successfully" });
  } catch (err) {
    logger.error("❌ Error-updateShortener:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteShortUrl = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const parsed = idSchema.safeParse(req.params.id);
    if (!parsed.success) {
      return res
        .status(400)
        .json({
          error: parsed.error.issues.map(
            (err: { message: string }) => err.message,
          ),
        });
    }

    const result = await deleteUrl(parsed.data);
    return res
      .status(200)
      .json({ message: "Deleted successfully", data: result });
  } catch (error) {
    logger.error("❌ Error-deleteShortUrl:", error);
    next(error);
  }
};

/**
 * PROFILE SETTINGS
 */

export const editPage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) return res.status(401).redirect("/auth/login");
  const userId = (req.user as accessTokenPayLoad).id;
  const result = await getUserById(userId);
  if (!result) {
    req.flash("error", "User not found");
    return res.status(404).redirect("/auth/login");
  }
  try {
    res.status(200).render("edit", {
      username: (req.user as accessTokenPayLoad).username,
      messages: {
        error: req.flash("error"),
        message: req.flash("message"),
      },
      noneSelected: result.password === null ? false : true,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserData = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) return res.status(401).redirect("/auth/login");
  const userId = (req.user as accessTokenPayLoad).id;
  const data = req.body;
  const result = await getUserById(userId);
  if (!result) {
    req.flash("error", "User not found");
    return res.status(404).redirect("/auth/login");
  }
  try {
    // --- CASE 1: USERNAME UPDATE ---
    if ("username" in data) {
      const validation = await nameSchema.safeParseAsync(data);
      if (!validation.success) {
        req.flash(
          "error",
          validation.error.issues.map((i: { message: string }) => i.message),
        );
        return res.status(400).redirect("/profile/edit");
      }

      const { username } = validation.data;
      if (username === (req.user as accessTokenPayLoad).username) {
        req.flash("message", "No changes detected");
      } else {
        const changedName = await updateUserName(username, userId);
        if (changedName) {
          req.flash("message", "Username updated successfully");
          await authentication({
            req,
            res,
            userId: changedName.id,
            username: changedName.username,
            email: changedName.email,
            isEmailValid: changedName.isEmailValid,
          });
        }
      }
      return res.status(303).redirect("/profile/edit");
    }

    // --- CASE 2: PASSWORD UPDATE ---
    if ("currentPassword" in data && "newPassword" in data) {
      const validation = await passwordSchema.safeParseAsync(data);
      if (!validation.success) {
        req.flash(
          "error",
          validation.error.issues.map((i: { message: string }) => i.message),
        );
        return res.status(400).redirect("/profile/edit");
      }

      const { currentPassword, newPassword } = validation.data;
      if (currentPassword === newPassword) {
        req.flash(
          "error",
          "New password cannot be the same as current password",
        );
        return res.status(400).redirect("/profile/edit");
      }

      try {
        await verifyCurrentPassword(currentPassword, userId);
        const hashedPassword = await argon2.hash(newPassword);
        await updateUserPassword(hashedPassword, userId);

        req.flash("message", "Password updated successfully!");
        return res.status(303).redirect("/profile/edit");
      } catch (err: any) {
        req.flash("error", err.message);
        return res.status(401).redirect("/profile/edit");
      }
    }
    // --- CASE 3: PASSWORD UPDATE AFTER SOCIAL LOGIN ---
    if (result.password == null && "newPassword" in data) {
      const validation = await resetPasswordSchema.safeParseAsync(data);
      if (!validation.success) {
        req.flash(
          "error",
          validation.error.issues.map((i: { message: string }) => i.message),
        );
        return res.status(400).redirect("/profile/edit");
      }
      const { newPassword } = validation.data;
      try {
        const hashedPassword = await argon2.hash(newPassword);
        await updateUserPassword(hashedPassword, userId);
        req.flash("message", "Password updated successfully!");
        return res.status(303).redirect("/profile/edit");
      } catch (err: any) {
        req.flash("error", err.message);
        return res.status(401).redirect("/profile/edit");
      }
    }
    // --- CASE 4: PROFILE PICTURE UPDATE ---
    if (req.file) {
      // Build the public web path string to store in the DB (e.g., "/uploads/avatar/12345-pic.png")
      // We slice off 'public' so the client can fetch it cleanly through your static assets middleman
      const relativeImagePath = `/${req.file.path.replace(/\\/g, "/").replace("public/", "")}`;

      // If the user already has a custom image, clean it up from the filesystem
      if (
        result.profilePicture &&
        result.profilePicture.startsWith("/uploads/")
      ) {
        const oldImagePath = path.join(
          process.cwd(),
          "public",
          result.profilePicture,
        );
        try {
          await fs.unlink(oldImagePath);
        } catch (unlinkError) {
          // Log filesystem errors but do not stop execution (e.g., if the file was already deleted manually)
          logger.warn(
            `Could not delete old profile picture at ${oldImagePath}`,
          );
        }
      }

      // Update URL reference string inside the database
      await updateUserProfilePicture(relativeImagePath, userId);

      req.flash("message", "Profile picture updated successfully!");
      return res.status(303).redirect("/profile/edit");
    }
  } catch (error) {
    logger.error("❌ Error-updateUserData:", error);
    next(error);
  }
};
