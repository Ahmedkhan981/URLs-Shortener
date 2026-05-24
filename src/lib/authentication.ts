import type { Request, Response } from "express";
import { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } from "../date.js";
import {
  createSession,
  generateAccessToken,
  generateRefreshToken,
} from "../service/JWT.service.js";
import { cookieConfig } from "./cookiesOptions.js";

export const authentication = async ({
  req,
  res,
  userId,
  username,
  email,
  isEmailValid,
}: {
  req: Request;
  res: Response;
  userId: number;
  username: string;
  email: string;
  isEmailValid: boolean;
}) => {
  try {
    // Create session
    const session = await createSession(userId, {
      ip_address: req.clientIp as string,
      user_agent: req.headers["user-agent"] as string,
    });

  if (!session) throw new Error("Session creation failed");

    // Generate tokens
    const accessToken = generateAccessToken({
      id: userId,
      username: username,
      email: email,
      isEmailValid,
      sessionId: session.id,
    });
    const refreshToken = generateRefreshToken(session.id);


    res.cookie("access_token", accessToken, {
      ...cookieConfig,
      maxAge: ACCESS_TOKEN_EXPIRY, // 15 minutes
    });
    res.cookie("refresh_token", refreshToken, {
      ...cookieConfig,
      maxAge: REFRESH_TOKEN_EXPIRY, // 7 days
    });
  } catch (error) {
    console.error("❌ Authentication error:", (error as Error).message);
  }
};
