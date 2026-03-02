import express from "express";
import productsRoutes from "./product.js";
import inventoryRoutes from "./inventory.js";

const router = express.Router();

router.use("/products", productsRoutes);
router.use("/inventory", inventoryRoutes);

export default router;
