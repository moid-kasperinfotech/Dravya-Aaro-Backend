import express from "express";
import technicianAuthRoutes from "./auth.js";

const router = express.Router();

router.use("auth", technicianAuthRoutes);

export default router;
