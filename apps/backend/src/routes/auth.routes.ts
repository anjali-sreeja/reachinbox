/**
 * Authentication Routes
 *
 * Exposes Google OAuth authentication flow, profile retrieval, and session termination.
 */

import { Router } from "express";
import passport from "passport";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth } from "../middleware/auth.middleware";
import {
  googleCallback,
  getMe,
  logout,
} from "../controllers/auth.controller";

const router = Router();

// GET /auth/google
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

// GET /auth/google/callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/auth/google/failure",
  }),
  asyncHandler(googleCallback)
);

// GET /auth/google/failure
router.get("/google/failure", (_req, res) => {
  res.status(401).json({
    success: false,
    message: "Google authentication failed or was cancelled.",
  });
});

// GET /api/auth/me
router.get("/me", requireAuth, asyncHandler(getMe));

// POST /api/auth/logout
router.post("/logout", asyncHandler(logout));

export default router;
