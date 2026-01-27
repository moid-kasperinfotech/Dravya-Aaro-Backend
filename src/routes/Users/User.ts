import express from "express";
import { getProfile, setFcmToken } from "../../controllers/Users/User.js";
import { authenticateUser } from "../../middlewares/authorisation.js";
const router = express.Router();

router.get("/profile", authenticateUser, getProfile);

router.post("/fcm-token", authenticateUser, setFcmToken);
router.use((req, res, next) => {
    const allowed = {
        "/profile": ["GET"],
        "/fcm-token": ["POST"],
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
