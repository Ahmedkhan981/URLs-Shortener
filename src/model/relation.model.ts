import { relations } from "drizzle-orm";
import { UserModel } from "./UserModel.model.js";
import { URLModel } from "./URLModel.model.js";
import { sessionModel } from "./session.model.js";
import { verifyEmailTokenModel } from "./verifyEmail.model.js";
import { resetPasswordModel } from "./resetPassword.model.js";
import { oauthModel } from "./Oauth.model.js";

export const userRelations = relations(UserModel, ({ many }) => ({
  urls: many(URLModel),
  sessions: many(sessionModel),
  oauths: many(oauthModel),
  verifyEmailTokens: many(verifyEmailTokenModel),
  resetPasswordTokens: many(resetPasswordModel),
}));

export const urlRelations = relations(URLModel, ({ one }) => ({
  user: one(UserModel, {
    fields: [URLModel.userId],
    references: [UserModel.id],
  }),
}));

export const sessionRelations = relations(sessionModel, ({ one }) => ({
  user: one(UserModel, {
    fields: [sessionModel.userId],
    references: [UserModel.id],
  }),
}));

export const verifyEmailTokenRelations = relations(
  verifyEmailTokenModel,
  ({ one }) => ({
    user: one(UserModel, {
      fields: [verifyEmailTokenModel.userId],
      references: [UserModel.id],
    }),
  }),
);

export const resetPasswordRelations = relations(
  resetPasswordModel,
  ({ one }) => ({
    user: one(UserModel, {
      fields: [resetPasswordModel.userId],
      references: [UserModel.id],
    }),
  }),
);

export const userOauthRelation = relations(oauthModel, ({ one }) => ({
  user: one(UserModel, {
    fields: [oauthModel.userId],
    references: [UserModel.id],
  }),
}));
