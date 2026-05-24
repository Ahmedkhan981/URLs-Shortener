import { registerUserSchema } from "./auth.validators.js";
import { loggingUserSchema } from './logging.validators.js';
import { shortenerSchema,idSchema } from './shortener.validators.js';
import { verifyEmailSchema } from './code.validators.js';
import { passwordSchema, nameSchema } from "./edit.validators.js";
import { forgetPasswordSchema } from "./email.validators.js";
import { resetPasswordSchema } from './resetPassword.validators.js';
import { googleAuthConfig } from "./google/googleAuth.validators.js";
import { googleAuthQuerySchema} from "./google/googleQuery.validators.js";
import { githubAuthConfig } from "./github/githubAuth.validators.js";
import { githubAuthQuerySchema } from './github/githubQuery.validator.js';

export {
  registerUserSchema,
  loggingUserSchema,
  shortenerSchema,
  idSchema,
  verifyEmailSchema,
  passwordSchema,
  nameSchema,
  forgetPasswordSchema,
  resetPasswordSchema,
  googleAuthConfig,
  googleAuthQuerySchema,
  githubAuthConfig,
  githubAuthQuerySchema,
};
