import express from "express";
import amcRoutes from "./amc.js";

const router = express.Router();

router.use("/amc", amcRoutes);

export default router;
