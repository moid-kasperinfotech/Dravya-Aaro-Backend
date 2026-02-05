import express from "express";
import auth from "./auth.js";
import userRoutes from "./User.js";
import serviceRoutes from "./services.js";

const router = express.Router();


// Auth routes
router.use("/auth", auth); // Done
// me routes
router.use("/me", userRoutes);

router.use("/", serviceRoutes);

export default router;
