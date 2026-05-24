import { fromRouter } from "./fromRouter.routes.js";
import { authRouter } from './auth.routes.js';
import { verifyRouter } from "./verifyEmail.routes.js";
import { googleRouter } from "./googleAuth.routes.js";
import { githubRouter } from './githubAuth.routes.js';

export { fromRouter, authRouter, verifyRouter, googleRouter, githubRouter };