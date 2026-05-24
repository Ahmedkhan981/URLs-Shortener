import { Router, type Router as RouterTypes } from "express";
import {
  getVerifyEmail,
  postVerifyEmail,
  resendVerificationCode,
} from "../controller/index.js";

export const verifyRouter: RouterTypes = Router();

verifyRouter.route("/verify-email").get(getVerifyEmail).post(postVerifyEmail);

verifyRouter.route("/resend-code").post(resendVerificationCode);
