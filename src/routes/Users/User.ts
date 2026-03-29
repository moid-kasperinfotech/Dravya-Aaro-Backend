import express, { Request, Response, NextFunction } from "express";
import { getProfile, setFcmToken } from "../../controllers/Users/User.js";
import { authenticateUser } from "../../middlewares/authorization.js";
import { methodGuard } from "../../middlewares/methodGuard.js";

/**
 * @swagger
 * tags:
 *   - name: User Profile (👇USER APIs)
 *     description: User profile management endpoints
 */

/**
 * @swagger
 * /user/me/profile:
 *   get:
 *     tags:
 *       - User Profile (👇USER APIs)
 *     summary: Get user profile
 *     description: Retrieve authenticated user's profile information
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   type: object
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /user/me/fcm-token:
 *   post:
 *     tags:
 *       - User Profile (👇USER APIs)
 *     summary: Set FCM token
 *     description: Update Firebase Cloud Messaging token for push notifications
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fcmToken
 *             properties:
 *               fcmToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: FCM token updated
 *       401:
 *         description: Unauthorized
 */

const router = express.Router();

router.get("/profile", authenticateUser, getProfile);

router.post("/fcm-token", authenticateUser, setFcmToken);

router.use((req: Request, res: Response, next: NextFunction) => {
    const allowed: Record<string, readonly string[]> = {
        "/profile": ["GET"],
        "/fcm-token": ["POST"],
    } as const;
    req.allowedMethods = allowed;
    return methodGuard(req, res, next);
});

export default router;
