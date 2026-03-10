import express from "express";
import adminAuthRoutes from "./auth.js";
import technicianRoutes from "./technicians.js";
import serviceRoutes from "./service.js";
import userRoutes from "./user.js";

const router = express.Router();

router.use("/auth", adminAuthRoutes); // Done
router.use("/technician", technicianRoutes); // Done
router.use("/service", serviceRoutes)
router.use("/user", userRoutes)

export default router;
