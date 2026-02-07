import express from "express";
import adminAuthRoutes from "./auth.js";
import technicianRoutes from "./technicians.js";

const router = express.Router();

router.use("/auth", adminAuthRoutes); // Done
router.use("/technicians", technicianRoutes); // Done

export default router;
