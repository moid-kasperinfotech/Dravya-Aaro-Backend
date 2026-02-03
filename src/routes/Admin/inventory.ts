import express from "express";
import { authenticateAdmin } from "../../middlewares/authorisation.js";
import {
    getAllProducts,
    addProduct,
    updateProduct,
    restockProduct,
    getLowStockProducts,
    deleteProduct,
} from "../../controllers/Admin/inventoryController.js";

const router = express.Router();

router.get("/", authenticateAdmin, getAllProducts);
router.get("/low-stock", authenticateAdmin, getLowStockProducts);
router.post("/add", authenticateAdmin, addProduct);
router.put("/:productId", authenticateAdmin, updateProduct);
router.post("/:productId/restock", authenticateAdmin, restockProduct);
router.delete("/:productId", authenticateAdmin, deleteProduct);

export default router;
