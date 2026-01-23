export const globalRateLimitOptions = {
    windowMs: 60 * 1000, // 1 minute
    max: 300, // allow enough requests for normal users
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests. Please slow down.",
    },
};
// rate limit
export const otpRateLimitOptions = {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many OTP verification attempts. Please try again after 5 minutes.",
    },
};