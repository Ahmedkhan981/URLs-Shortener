import type { Request, Response, NextFunction } from "express";
import {
  VerifyAccessToken,
  VerifyRefreshTokenAndNewTokens,
} from "../service/JWT.service.js";
import { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } from "../date.js";
import type { accessTokenPayLoad } from "../types/type.js";
import { cookieConfig } from "../lib/cookiesOptions.js";
export const verifyAuthentication = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const accessToken =
    req.signedCookies.access_token || req.cookies.access_token;
  const refreshToken =
    req.signedCookies.refresh_token || req.cookies.refresh_token;

  if (!accessToken && !refreshToken) {
    req.user = null;
    return next();
  }

  // 1. Try Access Token first
  if (accessToken) {
    try {
      const decoded = await VerifyAccessToken(accessToken);
      req.user = decoded as accessTokenPayLoad;
      return next();
    } catch (error) {
      // Access token failed (expired or invalid), don't return yet!
      // We will try the refresh token below if it exists.
      console.log("Access token invalid, checking refresh token...");
    }
  }

  // 2. Try Refresh Token if Access Token failed or didn't exist
  if (refreshToken) {
    try {
      const decode = await VerifyRefreshTokenAndNewTokens(refreshToken);

      res.cookie("access_token", decode.newAccessToken, {
        ...cookieConfig,
        maxAge: ACCESS_TOKEN_EXPIRY,
      });
      res.cookie("refresh_token", decode.newRefreshToken, {
        ...cookieConfig,
        maxAge: REFRESH_TOKEN_EXPIRY,
      });

      req.user = decode.user;
      return next();
    } catch (error) {
      // Refresh token is also dead. Clear everything.
      res.clearCookie("access_token", cookieConfig);
      res.clearCookie("refresh_token", cookieConfig);
      req.user = null;
      return next();
    }
  }

  req.user = null;
  return next();
};