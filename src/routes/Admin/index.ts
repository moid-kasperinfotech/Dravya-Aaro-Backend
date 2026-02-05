import express from "express";
import adminAuthRoutes from "./auth.js";
import jobRoutes from "./jobs.js";
import technicianRoutes from "./technicians.js";
import inventoryRoutes from "./inventory.js";

const router = express.Router();

router.use("/auth", adminAuthRoutes); // Done
router.use("/jobs", jobRoutes);
router.use("/technicians", technicianRoutes);
router.use("/inventory", inventoryRoutes);

export default router;
