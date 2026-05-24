import { Router, type Router as RouterTypes } from "express";
import {
  updateShortener,
  home,
  postData,
  redirect,
  userUrlData,
  deleteShortUrl,
  updateUserData,
  editPage,
} from "../controller/index.js";
import { multerUpload } from "../utils/multerUpload.js";
export const fromRouter: RouterTypes = Router();

fromRouter.route("/").get(home).post(postData);
fromRouter.route("/:shortUrl").get(redirect);
fromRouter.route("/profile").get(userUrlData);
fromRouter.route("/profile/:id").patch(updateShortener).delete(deleteShortUrl);
fromRouter
  .route("/profile/edit")
  .get(editPage)
  .post(multerUpload.single("avatar"), updateUserData);
