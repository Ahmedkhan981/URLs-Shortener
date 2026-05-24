import type { JwtPayload } from "jsonwebtoken";
import type { accessTokenPayLoad } from "./type";

// Global user token type
type userData = accessTokenPayLoad & JwtPayload;

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: userData | null;
    }
  }
}

export {};
