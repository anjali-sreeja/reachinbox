/**
 * Authentication Controller
 *
 * Handles Google OAuth callback, profile retrieval, and session logout.
 */

import type { Request, Response } from "express";
import type { User } from "@prisma/client";
import { AuthService } from "../services/auth.service";
import { corsOrigins, isProd } from "../config/env";
import { sendOk } from "../utils/apiResponse";
import { AppError } from "../utils/AppError";

/**
 * Handles the Google OAuth callback after successful authentication.
 * Issues a JWT token, sets a secure HTTP-only cookie, and redirects to frontend.
 */
export async function googleCallback(
  req: Request,
  res: Response
): Promise<void> {
  const user = req.user as User | undefined;

  if (!user) {
    throw AppError.unauthorized("Google authentication failed");
  }

  // 1. Generate JWT
  const token = AuthService.generateToken(user.id, user.email);

  // 2. Set secure HTTP-only cookie
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  });

  // 3. Redirect to frontend dashboard with token in URL param for client storage fallback
  const frontendOrigin = corsOrigins[0] || "http://localhost:5173";
  res.redirect(`${frontendOrigin}/?token=${encodeURIComponent(token)}`);
}

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's profile.
 */
export async function getMe(req: Request, res: Response): Promise<void> {
  const user = (req as Request & { user: User }).user;
  sendOk(res, user, "User profile retrieved successfully");
}

/**
 * POST /api/auth/logout
 * Clears the authentication cookie and ends the session.
 */
export async function logout(_req: Request, res: Response): Promise<void> {
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
  });

  sendOk(res, null, "Logged out successfully");
}
