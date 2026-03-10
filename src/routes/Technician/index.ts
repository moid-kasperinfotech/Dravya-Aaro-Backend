import express from "express";
import technicianAuthRoutes from "./auth.js";
import jobRoutes from "./job.js";
import statusRoutes from "./status.js";
import dashboardRoutes from "./dashboard.js";

const router = express.Router();

router.use("/auth", technicianAuthRoutes);
router.use("/status", statusRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/job", jobRoutes);

export default router;
