/**
 * Email routes
 *
 * Protected with requireAuth middleware:
 * POST   /api/emails/schedule    → schedule a new email
 * GET    /api/emails/scheduled   → list emails awaiting delivery
 * GET    /api/emails/sent        → list delivered emails
 */

import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth.middleware";
import {
  scheduleEmail,
  getScheduledEmails,
  getSentEmails,
} from "../controllers/email.controller";
import {
  scheduleEmailSchema,
  scheduledEmailsQuerySchema,
  sentEmailsQuerySchema,
} from "../types/email.types";

const router = Router();

// Protect all email routes with authentication
router.use(requireAuth);

// POST /api/emails/schedule
router.post(
  "/schedule",
  validate(scheduleEmailSchema, "body"),
  asyncHandler(scheduleEmail)
);

// GET /api/emails/scheduled
router.get(
  "/scheduled",
  validate(scheduledEmailsQuerySchema, "query"),
  asyncHandler(getScheduledEmails)
);

// GET /api/emails/sent
router.get(
  "/sent",
  validate(sentEmailsQuerySchema, "query"),
  asyncHandler(getSentEmails)
);

export default router;
