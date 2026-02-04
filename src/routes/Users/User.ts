import express, { Request, Response, NextFunction } from "express";
import { getProfile, setFcmToken } from "../../controllers/Users/User.js";
import { authenticateUser } from "../../middlewares/authorisation.js";
import { methodGuard } from "../../middlewares/methodGuard.js";
const router = express.Router();

router.get("/profile", authenticateUser, getProfile); // Done

router.post("/fcm-token", authenticateUser, setFcmToken); // Done
router.use((req: Request, res: Response, next: NextFunction) => {
    const allowed: Record<string, readonly string[]> = {
        "/profile": ["GET"],
        "/fcm-token": ["POST"],
    } as const;
    req.allowedMethods = allowed;
    return methodGuard(req, res, next);
});
export default router;
