import { and, eq } from "drizzle-orm";
import { UserModel } from "../model/UserModel.model.js";
import { connectDrizzle } from "../config/connectDB.js";
import { oauthModel } from "../model/Oauth.model.js";

const db = connectDrizzle;
export const getUserWithOauthId = async ({
  email,
  provider,
}: {
  email: string;
  provider: "google" | "github" | "microsoft" | "facebook";
}) => {
  const [result] = await db
    .select()
    .from(UserModel)
    .where(eq(UserModel.email, email))
    .leftJoin(
      oauthModel,
      and(
        eq(oauthModel.userId, UserModel.id),
        eq(oauthModel.provider, provider),
      ),
    );
  return result;
};
export const linkUserWithOauth = async ({
  userId,
  provider,
  providerAccountId,
}: {
  userId: number;
  provider: "google" | "github" | "microsoft" | "facebook";
  providerAccountId: string;
}) => {
  await db.insert(oauthModel).values({
    userId,
    provider,
    providerAccountId,
  });
};
export const createUserWithOauth = async ({
  email,
  name,
  provider,
  providerAccountId,
  isEmailVerified,
  profilePicture,
}: {
  email: string;
  name: string;
  provider: "google" | "github" | "microsoft" | "facebook";
  providerAccountId: string;
  isEmailVerified?: boolean;
  profilePicture:string;
}) => {
  return await db.transaction(async (tx) => {
    const [newUser] = await tx
      .insert(UserModel)
      .values({
        email,
        username: name,
        password: null, // OAuth users don't have a local password
        isEmailValid: isEmailVerified ?? false,
        profilePicture: profilePicture,
      })
      .$returningId();

    if (!newUser) throw new Error("Failed to create user during OAuth registration");

    await tx.insert(oauthModel).values({
      userId: newUser.id,
      provider,
      providerAccountId,
    });

    return {
      id: newUser.id,
      email,
      username: name,
      isEmailValid: isEmailVerified ?? false,
      provider,
      providerAccountId,
    };
  });
};
