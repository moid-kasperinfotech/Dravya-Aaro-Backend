import express from "express";
import auth from "./auth.js";
import userRoutes from "./User.js";
import serviceRoutes from "./service.js";
import bookingRoutes from "./booking.js";

const router = express.Router();


// Auth routes
router.use("/auth", auth); // Done
// me routes
router.use("/me", userRoutes);
// services routes
router.use("/service", serviceRoutes);
// booking routes
router.use("/booking", bookingRoutes);

export default router;
