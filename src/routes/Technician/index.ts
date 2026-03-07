import express from "express";
import technicianAuthRoutes from "./auth.js";
import jobRoutes from "./job.js";

const router = express.Router();

router.use("/auth", technicianAuthRoutes);
router.use("/job", jobRoutes);

export default router;
