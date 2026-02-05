import express from "express";
import technicianAuthRoutes from "./auth.js";
import technicianRoutes from "./technician.js";
import technicianJobRoutes from "./jobs.js";

const router = express.Router();

router.use("auth", technicianAuthRoutes);
router.use("/me", technicianRoutes);
router.use("/jobs", technicianJobRoutes);

export default router;
