import express from "express";
import adminAuthRoutes from "./auth.js";
import technicianRoutes from "./technicians.js";
import serviceRoutes from "./service.js";
import jobRoutes from "./jobConsolidated.js";
import dashboardRoutes from "./dashboardConsolidated.js";
import rescheduleRoutes from "./rescheduleConsolidated.js";

const router = express.Router();

router.use("/auth", adminAuthRoutes); // Done
router.use("/technician", technicianRoutes); // Done
router.use("/service", serviceRoutes); // Done
router.use("/", jobRoutes); // Job management (new)
router.use("/dashboard", dashboardRoutes); // Dashboard endpoints (new)
router.use("/reschedule-requests", rescheduleRoutes); // Reschedule/Reassign endpoints (new)

export default router;
