import express from "express";
import rateLimit from "express-rate-limit";
import { login, verifyOtp } from "../controllers/Users/auth.js";
import { otpRateLimitOptions } from "../utils/rateLimit.js";

const router = express.Router();

router.post("/login", login);

router.post("/verify-otp", rateLimit(otpRateLimitOptions), verifyOtp);

router.use((req, res, next) => {
    const allowed = {
        "/login": ["POST"],
        "/verify-otp": ["POST"],
    };
    const allowedMethods = allowed[req.path];
    if (allowedMethods && !allowedMethods.includes(req.method)) {
        res.set("Allow", allowedMethods.join(", "));
        return res
            .status(405)
            .json({ success: false, message: "Method Not Allowed" });
    }
    next();
});
export default router;
