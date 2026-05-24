import { Router, type Router as RouterTypes } from "express";
import {
  getForgetPasswordPage,
  getGithubLoginPage,
  getGoogleLoginPage,
  getLoginPage,
  getRegisterPage,
  getResetPage,
  handleResetPage,
  logout,
  postForgetPasswordData,
  postLoginData,
  postRegisterData,
  postResendForgetPasswordData,
  verifyForgetPasswordData,
} from "../controller/index.js";
import { forgetPasswordLimiter } from "../middleware/rateLimiter.middleware.js";

export const authRouter: RouterTypes = Router();

authRouter.route("/register").get(getRegisterPage).post(postRegisterData);
authRouter.route("/login").get(getLoginPage).post(postLoginData);

authRouter.route("/logout").get(logout);

// Forgot Password Routes
authRouter
  .route("/forgot-password")
  .get(getForgetPasswordPage)
  .post(forgetPasswordLimiter, postForgetPasswordData);

authRouter
  .route("/resend-code")
  .post(forgetPasswordLimiter, postResendForgetPasswordData); 
authRouter
  .route("/verify-code")
  .post(forgetPasswordLimiter, verifyForgetPasswordData); 
authRouter
  .route("/reset-password")
  .get(getResetPage)
  .post(forgetPasswordLimiter, handleResetPage); 
// google Auth Routes

authRouter.route("/google").get(getGoogleLoginPage);
//github
authRouter.route("/github").get(getGithubLoginPage);