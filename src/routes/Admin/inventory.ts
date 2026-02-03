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

router.get("/", authenticateAdmin, getAllProducts); // Done
router.get("/low-stock", authenticateAdmin, getLowStockProducts); // Done
router.post("/add", authenticateAdmin, addProduct); // Done
router.put("/:productId", authenticateAdmin, updateProduct); // Done
router.post("/:productId/restock", authenticateAdmin, restockProduct); // Done
router.delete("/:productId", authenticateAdmin, deleteProduct); // Done

export default router;
