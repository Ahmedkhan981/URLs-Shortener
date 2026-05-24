import { URLModel } from "./URLModel.model.js";
import { UserModel } from './UserModel.model.js';
import {
  userRelations,
  urlRelations,
  verifyEmailTokenRelations,
  sessionRelations,
  resetPasswordRelations,
  userOauthRelation,
} from "./relation.model.js";
import { sessionModel as sessionModel } from "./session.model.js";
import { verifyEmailTokenModel } from './verifyEmail.model.js';
import { resetPasswordModel } from './resetPassword.model.js';
import { oauthModel } from './Oauth.model.js';

export {
  URLModel,
  UserModel,
  sessionModel,
  verifyEmailTokenModel,
  userRelations,
  verifyEmailTokenRelations,
  urlRelations,
  sessionRelations,
  resetPasswordRelations,
  resetPasswordModel,
  oauthModel,
  userOauthRelation,
};