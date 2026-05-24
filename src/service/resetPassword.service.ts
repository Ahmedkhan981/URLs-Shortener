import { eq } from "drizzle-orm";
import { connectDrizzle } from "../config/connectDB.js";
import { resetPasswordModel, UserModel } from "../model/schema.js";
import * as argon2 from "argon2";
import { logger } from "../utils/logger.js";

const db = connectDrizzle;

export const hashPassword = async (password: string): Promise<string> => {
  return await argon2.hash(password);
};
export const verifyPassword = async (
  tokenCode: string,
  code: string,
): Promise<boolean> => {
  const result = await argon2.verify(tokenCode, code);
  return result;
};

export const resetPasswordCodeStore = async (userId: number, code: string) => {
  try {
    return await db.transaction(async (tx) => {
      await tx
        .delete(resetPasswordModel)
        .where(eq(resetPasswordModel.userId, userId));
      return await tx.insert(resetPasswordModel).values({ userId, code });
    });
  } catch (error) {
    logger.error("❌ Error-reset Password Code Store:", error);
  }
};
export const resetPasswordCodeCleanupAndUpdatePasswordAndGetUserData = async (
  userId: number,
  code: string,
) => {
  const hashResetPassword = await hashPassword(code);
  try {
    const result = await db.transaction(async (tx) => {
      await tx
        .delete(resetPasswordModel)
        .where(eq(resetPasswordModel.userId, userId));
      await tx
        .update(UserModel)
        .set({ password: hashResetPassword })
        .where(eq(UserModel.id, userId));

      const [updatedUser] = await tx
        .select()
        .from(UserModel)
        .where(eq(UserModel.id, userId))
        .limit(1);

      return updatedUser;
    });

    return result;
  } catch (error) {
    logger.error(`❌ Transaction Failed:`, error);
    return false;
  }
};
export const getUserAndResetPasswordToken = async (userId: number) => {
  const result = await db
    .select({
      user: UserModel,
      token: resetPasswordModel,
    })
    .from(UserModel)
    .leftJoin(resetPasswordModel, eq(UserModel.id, resetPasswordModel.userId))
    .where(eq(UserModel.id, userId))
    .limit(1);

  // If result is empty, user doesn't exist
  if (result.length === 0) return null;

  return result[0];
};
