import { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } from "../date.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../service/JWT.service.js";
import {
  verifyUserEmailAndCleanup,
} from "../service/operation.service.js";
import type { Response } from "express";
import type { UserModelType } from "../model/UserModel.model.js";

export const completeEmailVerification = async (
  res: Response,
  user: UserModelType,
  sessionId: number,
) => {
  const updated = await verifyUserEmailAndCleanup(user.id);
  if (!updated) throw new Error("Failed to verify email");

  const accessToken = generateAccessToken({
    id: updated.id,
    username: updated.username,
    email: updated.email,
    isEmailValid: updated.isEmailValid,
    sessionId,
  });

  const refreshToken = generateRefreshToken(sessionId);

  const cookieConfig = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    signed: true,
    sameSite: "lax" as const,
  };

  res.cookie("access_token", accessToken, {
    ...cookieConfig,
    maxAge: ACCESS_TOKEN_EXPIRY,
  });
  res.cookie("refresh_token", refreshToken, {
    ...cookieConfig,
    maxAge: REFRESH_TOKEN_EXPIRY,
  });

};
