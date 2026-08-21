/**
 * Google OAuth Passport Configuration
 *
 * Configures Google Strategy to authenticate users and persist/retrieve
 * User profiles in PostgreSQL.
 */

import passport from "passport";
import { Strategy as GoogleStrategy, type Profile, type VerifyCallback } from "passport-google-oauth20";
import { env } from "./env";
import { prisma } from "./prisma";

export function configurePassport(): void {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: Profile,
        done: VerifyCallback
      ) => {
        try {
          const email = profile.emails?.[0]?.value;

          if (!email) {
            return done(new Error("No email address returned from Google OAuth profile"), undefined);
          }

          const name = profile.displayName || email.split("@")[0] || "User";
          const avatar = profile.photos?.[0]?.value || null;

          // Upsert user in PostgreSQL
          const user = await prisma.user.upsert({
            where: { googleId: profile.id },
            update: {
              name,
              email,
              avatar,
            },
            create: {
              googleId: profile.id,
              email,
              name,
              avatar,
            },
          });

          // Ensure the user has at least one default sender registered
          const existingSender = await prisma.sender.findFirst({
            where: { userId: user.id },
          });

          if (!existingSender) {
            await prisma.sender.create({
              data: {
                userId: user.id,
                email: user.email,
                smtpUser: env.SMTP_USER || user.email,
                smtpPassword: env.SMTP_PASSWORD || env.SMTP_PASS || "ethereal-auto",
              },
            });
          }

          return done(null, user);
        } catch (err) {
          return done(err as Error, undefined);
        }
      }
    )
  );
}

export default passport;
