import express from "express";
import adminAuthRoutes from "./auth.js";
import technicianRoutes from "./technicians.js";
import serviceRoutes from "./service.js";
import jobRoutes from "./jobConsolidated.js";
import dashboardRoutes from "./dashboard.js";
import rescheduleRoutes from "./rescheduleConsolidated.js";
import paymentBillingRoutes from "./paymentBilling.js";
import technicianPayoutRoutes from "./technicianPayout.js";

const router = express.Router();

router.use("/auth", adminAuthRoutes); // Done
router.use("/technician", technicianRoutes); // Done
router.use("/service", serviceRoutes); // Done
router.use("/", jobRoutes); // Job management (new)
router.use("/dashboard", dashboardRoutes); // Dashboard endpoints (new)
router.use("/reschedule-requests", rescheduleRoutes); // Reschedule/Reassign endpoints (new)
router.use("/payment-billings", paymentBillingRoutes); // Payment & Billing endpoints (new)
router.use("/technician-payout", technicianPayoutRoutes); // Technician Payout endpoints (new)

export default router;
