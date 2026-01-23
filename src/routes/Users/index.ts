import express from "express";
import profileRoutes from "./User.js";
const router = express.Router();
router.use("/", profileRoutes);
export default router;
