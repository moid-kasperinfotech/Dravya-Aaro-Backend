import express from "express";
import adminAuthRoutes from "./auth.js";
import technicianRoutes from "./technicians.js";
import serviceRoutes from "./service.js";
import jobRoutes from "./job.js";
import jobConsolidatedRoutes from "./jobConsolidated.js";
import dashboardRoutes from "./dashboard.js";
import dashboardConsolidatedRoutes from "./dashboardConsolidated.js"
import rescheduleRoutes from "./rescheduleConsolidated.js";
import paymentBillingRoutes from "./paymentBilling.js";
import technicianPayoutRoutes from "./technicianPayout.js";
import userRoutes from "./user.js";

const router = express.Router();

router.use("/auth", adminAuthRoutes); // Done
router.use("/technician", technicianRoutes); // Done
router.use("/service", serviceRoutes); // Done
router.use("/", jobRoutes); // Job management (old)
router.use("/", jobConsolidatedRoutes); // Job management (consolidated)
router.use("/dashboard", dashboardRoutes); // Dashboard endpoints (old)
router.use("/dashboard", dashboardConsolidatedRoutes); // Dashboard consolidated endpoints (new)
router.use("/reschedule-requests", rescheduleRoutes); // Reschedule/Reassign endpoints (new)
router.use("/payment-billings", paymentBillingRoutes); // Payment & Billing endpoints (new)
router.use("/technician-payout", technicianPayoutRoutes); // Technician Payout endpoints (new)
router.use("/user", userRoutes)

export default router;
