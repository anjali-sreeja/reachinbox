/**
 * Sender Routes
 *
 * Provides endpoints for sender account management.
 */

import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth } from "../middleware/auth.middleware";
import { getSenders, createSender } from "../controllers/sender.controller";

const router = Router();

router.use(requireAuth);

router.get("/", asyncHandler(getSenders));
router.post("/", asyncHandler(createSender));

export default router;
