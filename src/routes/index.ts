import express from "express";
import auth from "./auth.js";
import userRoutes from "./Users/index.js";
import adminRoutes from "./Admin/index.js";
import technicianRoutes from "./Technician/index.js";
const router = express.Router();

router.get("/", (req, res, next) => {
    try {
        return res.send("Hello from Express 🚀");
    }
    catch (error) {
        next(error);
    }
});
// Auth routes
router.use("/auth", auth);
// me routes
router.use("/me", userRoutes);
// admin routes
router.use("/admin", adminRoutes);
// technician routes
router.use("/technician", technicianRoutes);
export default router;
