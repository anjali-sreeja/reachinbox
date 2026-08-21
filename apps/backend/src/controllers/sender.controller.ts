/**
 * Sender Controller
 *
 * Manages SMTP sender accounts associated with authenticated users.
 */

import type { Request, Response } from "express";
import type { User } from "@prisma/client";
import { prisma } from "../config/prisma";
import { sendOk, sendCreated } from "../utils/apiResponse";
import { AppError } from "../utils/AppError";

/**
 * GET /api/senders
 * Lists all senders for the authenticated user.
 */
export async function getSenders(req: Request, res: Response): Promise<void> {
  const user = (req as Request & { user: User }).user;

  let senders = await prisma.sender.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      email: true,
      smtpUser: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // If no sender exists yet, auto-create a default sender for convenience
  if (senders.length === 0) {
    const newSender = await prisma.sender.create({
      data: {
        userId: user.id,
        email: user.email,
        smtpUser: user.email,
        smtpPassword: "ethereal-auto",
      },
      select: {
        id: true,
        email: true,
        smtpUser: true,
        createdAt: true,
      },
    });
    senders = [newSender];
  }

  sendOk(res, senders, "Senders retrieved successfully");
}

/**
 * POST /api/senders
 * Registers a new sender for the authenticated user.
 */
export async function createSender(req: Request, res: Response): Promise<void> {
  const user = (req as Request & { user: User }).user;
  const { email, smtpUser, smtpPassword } = req.body as {
    email: string;
    smtpUser?: string;
    smtpPassword?: string;
  };

  if (!email) {
    throw AppError.badRequest("Sender email is required");
  }

  const sender = await prisma.sender.create({
    data: {
      userId: user.id,
      email,
      smtpUser: smtpUser || email,
      smtpPassword: smtpPassword || "ethereal-auto",
    },
    select: {
      id: true,
      email: true,
      smtpUser: true,
      createdAt: true,
    },
  });

  sendCreated(res, sender, "Sender created successfully");
}
