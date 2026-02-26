import express from "express";
import rateLimit from "express-rate-limit";
import { login, verifyOtp } from "../../controllers/Users/auth.js";
import { otpRateLimitOptions } from "../../utils/rateLimit.js";
import { methodGuard } from "../../middlewares/methodGuard.js";

const router = express.Router();

//api/v1/user/auth/login
router.post("/login", login);

//api/v1/user/auth/verify-otp
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
