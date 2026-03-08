import express from "express";
import adminAuthRoutes from "./auth.js";
import technicianRoutes from "./technicians.js";
import serviceRoutes from "./service.js";
import jobRoutes from "./job.js";

const router = express.Router();

router.use("/auth", adminAuthRoutes); // Done
router.use("/technician", technicianRoutes); // Done
router.use("/service", serviceRoutes); // Done
router.use("/", jobRoutes); // Job management (new)

export default router;
