
import { Router, type Router as RouterTypes } from 'express';
import { getGoogleAuth } from '../controller/index.js';



export const googleRouter:RouterTypes = Router();


googleRouter.route("/callback").get(getGoogleAuth);