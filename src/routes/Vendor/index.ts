import express from "express";
import purchaseRoutes from "./purchase.js";
import vendorRoutes from "./vendor.js";

const router = express.Router();

router.use("/purchases", purchaseRoutes);
router.use("/", vendorRoutes);

export default router;
