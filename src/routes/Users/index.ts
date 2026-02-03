import express from "express";
import profileRoutes from "./User.js";
import servicesRoutes from "./services.js";
const router = express.Router();

router.use("/profile", profileRoutes);
router.use("/", servicesRoutes);

export default router;
