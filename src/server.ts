import "dotenv/config";
import express, { type Application } from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import flash from "connect-flash";
import requestIp from "request-ip";
import MySQLStoreFactory from "express-mysql-session";

import { poolConnection } from "./config/connectDB.js";
import {
  error,
  notFound,
  userData,
  verifyAuthentication,
} from "./middleware/middleware.js";
import {
  authRouter,
  fromRouter,
  githubRouter,
  googleRouter,
  verifyRouter,
} from "./router/routes.js";
import path from "node:path";

const app: Application = express();

// ─── Middleware ─────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestIp.mw());
app.use(cookieParser(process.env.SESSION_SECRET));
app.use(express.static(path.join(process.cwd(), "public")));
const MySQLStore = MySQLStoreFactory(session as any);
const sessionStore = new MySQLStore(
  {
    clearExpired: true,
    checkExpirationInterval: 900000,
    expiration: 86400000,
    createDatabaseTable: true,
  },
  poolConnection as any,
);
sessionStore.on("error", (err) => {
  console.error("Session Store Error:", err);
});
app.use(
  session({
    name: "session_cookies",
    secret: process.env.SESSION_SECRET || "secret",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60,
      secure: true,
      httpOnly: true,
      sameSite: "lax", // Better for OAuth redirects (Google/Github)
    },
  }),
);
app.use(flash());
app.use(verifyAuthentication);
app.use(userData);
app.set("view engine", "ejs");
app.set("views", "./views");

// ─── Routes ─────────────────────────────────────
app.use("/google", googleRouter);
app.use("/github", githubRouter);
app.use("/auth", authRouter);
app.use("/verify", verifyRouter);
app.use(fromRouter); // Usually catch-all routes go last

app.use(notFound);
app.use(error);

// ─── Execution Logic ────────────────────────────
const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});

// At the bottom of server.ts
const server = app;
export default server;
