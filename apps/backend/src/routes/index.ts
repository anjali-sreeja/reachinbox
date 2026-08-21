/**
 * Root router – aggregates all sub-routers.
 *
 * Mounted in app.ts at "/":
 *   healthRouter  → GET  /health
 *   authRouter    → GET  /auth/google
 *                   GET  /auth/google/callback
 *                   GET  /api/auth/me
 *                   POST /api/auth/logout
 *   emailRouter   → POST /api/emails/schedule
 *                   GET  /api/emails/scheduled
 *                   GET  /api/emails/sent
 *   senderRouter  → GET  /api/senders
 *                   POST /api/senders
 */

import { Router } from "express";
import healthRouter from "./health.routes";
import authRouter from "./auth.routes";
import emailRouter from "./email.routes";
import senderRouter from "./sender.routes";

const router = Router();

router.use("/health", healthRouter);
router.use("/auth", authRouter);
router.use("/api/auth", authRouter);
router.use("/api/emails", emailRouter);
router.use("/api/senders", senderRouter);

export default router;
