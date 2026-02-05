import express, { Request, Response, NextFunction } from "express";
import userRoutes from "./Users/index.js";
import adminRoutes from "./Admin/index.js";
import technicianRoutes from "./Technician/index.js";
const router = express.Router();

router.get("/", (_req: Request, res: Response, next: NextFunction) => {
    try {
        return res.send("Hello from Express 🚀");
    }
    catch (error) {
        return next(error);
    }
});

// user routes
router.use("/user", userRoutes);
// admin routes
router.use("/admin", adminRoutes);
// technician routes
router.use("/technician", technicianRoutes);
export default router;
