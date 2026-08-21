/**
 * Express application factory.
 *
 * Configures all middleware, Passport authentication, and routes.
 */

import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import passport from "passport";

import { corsOrigins, isDev } from "./config/env";
import { configurePassport } from "./config/passport";
import { errorHandler } from "./middleware/errorHandler";
import { notFoundHandler } from "./middleware/notFound";
import rootRouter from "./routes";

export function createApp(): Express {
  const app = express();

  // ── Configure Passport Google Strategy ──────────────────────
  configurePassport();

  // ── Security headers ────────────────────────────────────────
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  // ── CORS ────────────────────────────────────────────────────
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (curl, Postman, server-to-server)
        if (!origin) return callback(null, true);
        if (corsOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS: origin '${origin}' not allowed`));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
    })
  );

  // ── Body parsers ────────────────────────────────────────────
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // ── Cookies ─────────────────────────────────────────────────
  app.use(cookieParser());

  // ── Compression ─────────────────────────────────────────────
  app.use(compression());

  // ── Passport Initialization ─────────────────────────────────
  app.use(passport.initialize());

  // ── Request logging (dev only) ──────────────────────────────
  if (isDev) {
    app.use((req, _res, next) => {
      console.log(`→ ${req.method} ${req.path}`);
      next();
    });
  }

  // ── Trust proxy (needed behind nginx/load balancer) ─────────
  app.set("trust proxy", 1);

  // ── Routes ──────────────────────────────────────────────────
  app.use(rootRouter);

  // ── 404 catch-all (must come after all routes) ──────────────
  app.use(notFoundHandler);

  // ── Global error handler (must be last, 4-param signature) ──
  app.use(errorHandler);

  return app;
}
