/**
 * Authentication Service
 *
 * Handles JWT token generation and verification for authenticated sessions.
 */

import jwt, { type Secret } from "jsonwebtoken";
import { env } from "../config/env";
import type { JwtPayload } from "../types";

export class AuthService {
  /**
   * Generates a signed JWT for an authenticated user.
   */
  static generateToken(userId: string, email: string): string {
    const payload: JwtPayload = {
      sub: userId,
      email,
    };

    return jwt.sign(payload, env.JWT_SECRET as Secret, {
      expiresIn: "7d",
    });
  }

  /**
   * Verifies and decodes a JWT token.
   */
  static verifyToken(token: string): JwtPayload {
    return jwt.verify(token, env.JWT_SECRET as Secret) as JwtPayload;
  }
}
