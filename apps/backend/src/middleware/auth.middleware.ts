/**
 * Authentication Middleware
 *
 * Verifies JWT tokens delivered via HTTP-only cookies or Authorization Bearer header.
 * Attaches the authenticated user record to req.user.
 */

import type { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token: string | undefined;

    // 1. Check HTTP-only cookie first
    if (req.cookies && req.cookies["token"]) {
      token = req.cookies["token"] as string;
    }

    // 2. Fallback to Authorization: Bearer <token> header
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      throw AppError.unauthorized("Authentication required");
    }

    // 3. Verify JWT
    const payload = AuthService.verifyToken(token);

    // 4. Retrieve User from PostgreSQL
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        googleId: true,
        email: true,
        name: true,
        avatar: true,
      },
    });

    if (!user) {
      throw AppError.unauthorized("User account no longer exists");
    }

    // 5. Attach user to request
    (req as Request & { user: typeof user }).user = user;
    next();
  } catch (err: unknown) {
    if (err instanceof AppError) {
      next(err);
      return;
    }

    // Handle JsonWebToken errors
    next(AppError.unauthorized("Invalid or expired authentication token"));
  }
}
