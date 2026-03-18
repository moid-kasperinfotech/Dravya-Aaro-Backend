import express from "express";
import rateLimit from "express-rate-limit";
import { login, verifyOtp } from "../../controllers/Users/auth.js";
import { otpRateLimitOptions } from "../../utils/rateLimit.js";
import { methodGuard } from "../../middlewares/methodGuard.js";

/**
 * @swagger
 * tags:
 *   - name: User Auth (👇PUBLIC APIs)
 *     description: User authentication endpoints
 */

/**
 * @swagger
 * /user/auth/login:
 *   post:
 *     tags:
 *       - User Auth
 *     summary: User login
 *     description: Login with phone number or email and get OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mobileNumber
 *             properties:
 *               mobileNumber:
 *                 type: string
 *                 regex: ^[1-9]\d{9}$
 *                 example: 9876543210
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid input
 *       429:
 *         description: Too many requests
 */

/**
 * @swagger
 * /user/auth/verify-otp:
 *   post:
 *     tags:
 *       - User Auth
 *     summary: Verify OTP and login
 *     description: Verify OTP sent to email/phone to complete login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mobileNumber
 *               - otp
 *             properties:
 *               mobileNumber:
 *                type: string
 *                regex: ^[1-9]\d{9}$
 *                example: 9876543210
 *               otp:
 *                 type: string
 *                 regex: ^\d{6}$
 *                 example: 123456
 *                 minimum: 100000
 *                 maximum: 999999
 *     responses:
 *       200:
 *         description: Login successful
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: token=abcdef123456; Path=/; HttpOnly
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   type: object
 *       400:
 *         description: Invalid OTP
 *       429:
 *         description: Too many verification attempts
 */

const router = express.Router();

router.post("/login", login);

router.post("/verify-otp", rateLimit(otpRateLimitOptions), verifyOtp);

router.use((req, res, next) => {
    const allowed: Record<string, readonly string[]> = {
        "/profile": ["GET"],
        "/fcm-token": ["POST"],
    } as const;
    req.allowedMethods = allowed;
    return methodGuard(req, res, next);
});
export default router;
