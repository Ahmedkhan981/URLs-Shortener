import { Router, type Router as RouterTypes } from "express";
import { getGithubAuth } from "../controller/index.js";

export const githubRouter: RouterTypes = Router();

githubRouter.route("/callback").get(getGithubAuth);
