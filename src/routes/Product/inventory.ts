import express from "express";
import { authenticateAdmin } from "../../middlewares/authorisation.js";
import {
  addProduct,
  getAllProducts,
  getLowStockProducts,
  restockProduct,
  updateProduct,
  updateProductStatus,
} from "../../controllers/Product/inventoryController.js";

const router = express.Router();

// admin routes
router.post("/addProduct", authenticateAdmin, addProduct);
router.get("/getAllProducts", authenticateAdmin, getAllProducts);
router.get("/getLowStock", authenticateAdmin, getLowStockProducts);
router.put("/updateProduct/:productId", authenticateAdmin, updateProduct);
router.patch(
  "/deleteProduct/:productId",
  authenticateAdmin,
  updateProductStatus,
);
router.patch("/restockProduct/:productId", authenticateAdmin, restockProduct);

export default router;
