//+ token
import jwt from "jsonwebtoken";
import type {
  accessTokenPayLoad,
  CreateSessionPayload,
  ResetSessionPayload,
  Token,
} from "../types/type.js";
import { connectDrizzle } from "../config/connectDB.js";
import { sessionModel } from "../model/schema.js";
import {
  ACCESS_TOKEN_EXPIRY,
  MILLISECONDS_PER_SECOND,
  REFRESH_TOKEN_EXPIRY,
} from "../date.js";
import { getSessionById, getUserById } from "./operation.service.js";
import { logger } from "../utils/logger.js";
//+ For create session
const db = connectDrizzle;
export const createSession = async (
  userId: number,
  { ip_address, user_agent }: CreateSessionPayload,
): Promise<{ id: number } | undefined> => {
  if (!ip_address || !user_agent) return undefined;

  try {
    return await db.transaction(async (tx) => {
      const [session] = await tx
        .insert(sessionModel)
        .values({
          userId,
          ip_address,
          user_agent,
        })
        .$returningId();

      return session; 
    });
  } catch (error) {
    logger.error("Session creation failed:", error);
    throw new Error("Could not create session"); 
  }
};

export const generateAccessToken = ({
  id,
  username,
  email,
  sessionId,
  isEmailValid,
}: accessTokenPayLoad) => {
  if (!process.env.ACCESS_TOKEN_JWT_SECRET_KEY) {
    throw new Error(
      "ACCESS_TOKEN_JWT_SECRET_KEY is not defined in environment variables",
    );
  }
  return jwt.sign(
    { id, username, email, sessionId, isEmailValid },
    process.env.ACCESS_TOKEN_JWT_SECRET_KEY,
    {
      expiresIn: ACCESS_TOKEN_EXPIRY / MILLISECONDS_PER_SECOND, //
    },
  );
};
export const generateRefreshToken = (sessionId: number): string => {
  if (!process.env.REFRESH_TOKEN_JWT_SECRET_KEY) {
    throw new Error(
      "REFRESH_TOKEN_JWT_SECRET_KEY is not defined in environment variables",
    );
  }
  return jwt.sign({ sessionId }, process.env.REFRESH_TOKEN_JWT_SECRET_KEY, {
    expiresIn: REFRESH_TOKEN_EXPIRY / MILLISECONDS_PER_SECOND,
  });
};

export const VerifyAccessToken = async (token: string): Promise<Token> => {
  try {
    const secret = process.env.ACCESS_TOKEN_JWT_SECRET_KEY;

    if (!secret) {
      // This is a server configuration error, not a user error
      throw new Error("ACCESS_TOKEN_JWT_SECRET_KEY is not defined");
    }

    const decoded = jwt.verify(token, secret);

    // Type guard for the payload
    if (!decoded || typeof decoded !== "object" || !("sessionId" in decoded)) {
      throw new Error("Invalid access token payload: missing sessionId");
    }

    return decoded as Token;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.warn("⚠️ JWT: Token expired");
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.warn(
        `❌ JWT: Invalid signature or malformed token: ${error.message}`,
      );
    } else {
      console.error(`🔥 JWT: Unexpected Error: ${(error as Error).message}`);
    }
    throw error;
  }
};

export const VerifyRefreshTokenAndNewTokens = async (token: string) => {
  const secret = process.env.REFRESH_TOKEN_JWT_SECRET_KEY;
  if (!secret) throw new Error("Missing REFRESH_TOKEN_JWT_SECRET_KEY");

  // 1. Decode the refresh token
  const decoded = jwt.verify(token, secret) as { sessionId: number };

  // 2. Database Lookup
  const currentSession = await getSessionById(decoded.sessionId);

  // 3. Validation Check
  if (!currentSession || !currentSession.isValid) {
    throw new Error("Session expired or invalid");
  }

  // 4. User Lookup
  const user = await getUserById(currentSession.userId);
  if (!user) throw new Error("User not found");

  const tokenPayload: accessTokenPayLoad = {
    id: user.id,
    username: user.username,
    email: user.email,
    isEmailValid: user.isEmailValid,
    sessionId: currentSession.id,
  };

  // 5. Rotate Tokens
  return {
    newAccessToken: generateAccessToken(tokenPayload),
    newRefreshToken: generateRefreshToken(currentSession.id),
    user: tokenPayload,
  };
};


export const resetToken = ({ userId, email ,purpose}: ResetSessionPayload) => {
  return jwt.sign(
    {
      userId,
      email,
      purpose,
    } satisfies ResetSessionPayload,
    process.env.JWT_SECRET_KEY!,
    { expiresIn: "15m" },
  );
};
