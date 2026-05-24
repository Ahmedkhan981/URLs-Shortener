
import {
  postData,
  redirect,
  home,
  userUrlData,
  updateShortener,
  deleteShortUrl,
  updateUserData,
  editPage,
} from "./postData.controller.js";
import { getRegisterPage, postRegisterData } from "./register.controller.js";
import { postLoginData, getLoginPage,logout } from "./getLoginPage.controller.js";
import {
  getForgetPasswordPage,
  getResetPage,
  postForgetPasswordData,
  postResendForgetPasswordData,
  verifyForgetPasswordData,
  handleResetPage,
} from "./forgetPassword.controller.js";
import {
  getVerifyEmail,
  postVerifyEmail,
  resendVerificationCode,
} from "./verifyEmail.controller.js";
import { getGoogleAuth, getGoogleLoginPage } from "./googleAuth.controller.js";
import { getGithubAuth, getGithubLoginPage } from "./githubAuth.controller.js";
export {
  home,
  postData,
  deleteShortUrl,
  userUrlData,
  redirect,
  getLoginPage,
  getRegisterPage,
  postLoginData,
  postRegisterData,
  logout,
  updateShortener,
  getVerifyEmail,
  postVerifyEmail,
  resendVerificationCode,
  updateUserData,
  editPage,
  getForgetPasswordPage,
  postForgetPasswordData,
  postResendForgetPasswordData,
  verifyForgetPasswordData,
  getResetPage,
  handleResetPage,
  getGoogleAuth,
  getGoogleLoginPage,
  getGithubLoginPage,
  getGithubAuth,
};