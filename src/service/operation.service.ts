import { eq, lt, sql, and } from "drizzle-orm";
import { connectDrizzle } from "../config/connectDB.js";
import {
  sessionModel,
  URLModel,
  UserModel,
  verifyEmailTokenModel,
} from "../model/schema.js";
import type { RegisterType } from "../types/type.js";
import * as argon2 from "argon2";
import type { UserModelType } from "../model/UserModel.model.js";
import crypto from "crypto";
import { logger } from "../utils/logger.js";

const db = connectDrizzle;
export const existingURL = async (
  originalUrl: string,
): Promise<string | null> => {
  try {
    const result = await db
      .select()
      .from(URLModel)
      .where(eq(URLModel.originalUrl, originalUrl))
      .limit(1);
    if (result.length > 0) {
      return result[0]?.shortUrl || "";
    }
    return null;
  } catch (error) {
    logger.error(` ❌ Error-existingURL: ${error}`);
    return null;
  }
};
export const getOriginalURL = async (
  shortUrl: string,
): Promise<string | null> => {
  try {
    const result = await db
      .select()
      .from(URLModel)
      .where(eq(URLModel.shortUrl, shortUrl))
      .limit(1);

    if (result.length > 0) {
      return result[0]?.originalUrl || "";
    }
    return null;
  } catch (error) {
    logger.error(`❌ Error: ${error}`);
    return null;
  }
};
export const storeShortURL = async (
  originalUrl: string,
  shortUrl: string,
  userId: number,
): Promise<void> => {
  try {
    await db.insert(URLModel).values({ originalUrl, shortUrl, userId });
  } catch (error) {
    logger.error(` ❌ Error-storeShortURL: ${error}`);
  }
};

export const updateUrl = async (
  id: number,
  shortUrl: string,
  originalUrl: string,
) => {
  try {
    const result = await db
      .update(URLModel)
      .set({ shortUrl, originalUrl })
      .where(eq(URLModel.id, id));

    return result; // MySQL returns info about affected rows here
  } catch (error) {
    logger.error("DB Update Error:", error);
    throw error; // Crucial: allow the controller to catch this
  }
};
export const deleteUrl = async (id: number) => {
  try {
    const result = await db.delete(URLModel).where(eq(URLModel.id, id));

    return result[0] || [];
  } catch (error) {
    logger.error(error);
  }
};
//+ add user

export const createUser = async ({
  username,
  email,
  password,
}: Omit<RegisterType, "confirmPassword">) => {
  try {
    const hashPassword = await argon2.hash(password);
    const [user] = await db
      .insert(UserModel)
      .values({ username, email, password: hashPassword })
      .$returningId();

    return user;
  } catch (error) {
    logger.error(`❌ Error: createUser ${(error as Error).message} `);
    throw error;
  }
};

export const getUserByEmail = async (email: string) => {
  try {
    const result = await db
      .select()
      .from(UserModel)
      .where(eq(UserModel.email, email))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    logger.error(`❌ Error: getUserByEmail ${(error as Error).message} `);
  }
};

export async function getSessionById(sessionId: number) {
  const result = await db
    .select()
    .from(sessionModel)
    .where(eq(sessionModel.id, sessionId));

  return result[0] || null;
}

export async function getUserById(userId: number): Promise<UserModelType> {
  try {
    const result = await db
      .select()
      .from(UserModel)
      .where(eq(UserModel.id, userId));

    return result[0] as UserModelType;
  } catch (error) {
    logger.error(`❌ Error: getUserById ${(error as Error).message} `);
    throw error;
  }
}

export const clearSession = async (sessionId: number): Promise<void> => {
  try {
    const sessions = await db
      .delete(sessionModel)
      .where(eq(sessionModel.id, sessionId));
  } catch (error) {
    logger.error(`❌ Error-clearSession: ${(error as Error).message}`);
  }
};

export const sessionData = async (userId: number) => {
  try {
    const result = await db
      .select()
      .from(sessionModel)
      .where(eq(sessionModel.userId, userId));

    return result[0];
  } catch (error) {
    logger.error(`❌ Error: ${error}`);
  }
};

//- otp
export const generateOTP = (digit: number = 8) => {
  const otp = crypto.randomInt(10 ** (digit - 1), 10 ** digit).toString();
  return otp;
};
//- store otp
export const storeOTP = async (userId: number, code: string) => {
  try {
    return await db.transaction(async (tx) => {
      await tx
        .delete(verifyEmailTokenModel)
        .where(eq(verifyEmailTokenModel.userId, userId));
      return await tx.insert(verifyEmailTokenModel).values({ userId, code });
    });
  } catch (error) {
    logger.error("❌ Error-storeOTP:", error);
  }
};

//! join

//join
export const getUserByIdJoinUserRelateUrl = async (userId: number) => {
  const rows = await db
    .select({
      user: UserModel,
      url: URLModel,
    })
    .from(UserModel)
    .leftJoin(URLModel, eq(UserModel.id, URLModel.userId))
    .where(eq(UserModel.id, userId));
  return rows;
};

export const getUserAndToken = async (userId: number) => {
  const result = await db
    .select({
      user: UserModel,
      token: verifyEmailTokenModel,
    })
    .from(UserModel)
    .leftJoin(
      verifyEmailTokenModel,
      eq(UserModel.id, verifyEmailTokenModel.userId),
    )
    .where(eq(UserModel.id, userId))
    .limit(1);

  // If result is empty, user doesn't exist
  if (result.length === 0) return null;

  return result[0];
};
//!transaction
export const registerTransaction = async ({
  username,
  email,
  password,
}: {
  username: string;
  email: string;
  password: string;
}) => {
  return await db.transaction(async (tx) => {
    const hashPassword = await argon2.hash(password);
    // 1. Check existence
    const existing = await tx
      .select()
      .from(UserModel)
      .where(eq(UserModel.email, email))
      .limit(1);

    if (existing.length > 0) return { error: "User already exists" };
    // 2. Create user
    const [newUser] = await tx
      .insert(UserModel)
      .values({ username, email, password: hashPassword })
      .$returningId();

    return { user: newUser };
  });
};
//-
export const verifyUserEmailAndCleanup = async (userId: number) => {
  try {
    // Return the result of the transaction directly
    const result = await db.transaction(async (tx) => {
      // 1. Update User Status
      await tx
        .update(UserModel)
        .set({ isEmailValid: true })
        .where(eq(UserModel.id, userId));

      // 2. Delete the used Token
      await tx
        .delete(verifyEmailTokenModel)
        .where(eq(verifyEmailTokenModel.userId, userId));

      // 3. Select the user
      // Note: .select() returns an array, so we take the first element
      const [updatedUser] = await tx
        .select()
        .from(UserModel)
        .where(eq(UserModel.id, userId))
        .limit(1);

      return updatedUser;
    });

    return result; // This will be the user object or undefined
  } catch (error) {
    logger.error(`❌ Transaction Failed:`, error);
    return false;
  }
};