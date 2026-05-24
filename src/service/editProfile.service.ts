import { eq } from "drizzle-orm";
import { UserModel } from "../model/schema.js";
import { connectDrizzle } from "../config/connectDB.js";
import type { UserModelType } from "../model/UserModel.model.js";
import { getUserById } from "./operation.service.js";
import * as argon2 from "argon2";
const db = connectDrizzle;
export const updateUserName = async (username: string, id: number) => {
  try {
    const result = await db.transaction(async (tx) => {
      await tx.update(UserModel).set({ username }).where(eq(UserModel.id, id));

      const updatedUser = await db
        .select()
        .from(UserModel)
        .where(eq(UserModel.id, id))
        .limit(1);

      return updatedUser[0];
    });
    return result as UserModelType;
  } catch (error: any) {
    if (error.errno === 1062) {
      throw new Error("This username is already taken.");
    }
    console.error("Transaction Error:", error);
    throw error;
  }
};

export const verifyCurrentPassword = async (
  currentPassword: string,
  id: number,
) => {
  try {
    const user = await getUserById(id);
    if (!user) throw new Error("User not found");

    if (!user.password) {
      throw new Error("This account does not have a password set. Please use social login.");
    }

    // Argon2 verification
    const isValidPassword = await argon2.verify(user.password, currentPassword);

    if (!isValidPassword) {
      throw new Error("Current password is incorrect.");
    }

  } catch (error) {
    throw error;
  }
};
export const updateUserPassword = async (
  hashedPassword: string,
  id: number,
) => {
  try {
    await db
      .update(UserModel)
      .set({ password: hashedPassword })
      .where(eq(UserModel.id, id));
  } catch (error) {
    throw error;
  }
};

export const updateUserProfilePicture = async (
  imagePath: string,
  id: number,
) => {
  try {
    await db
      .update(UserModel)
      .set({ profilePicture: imagePath })
      .where(eq(UserModel.id, id));
  } catch (error) {
    throw error;
  }
};
