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

/**
 * @swagger
 * tags:
 *   - name: Inventory
 *     description: Inventory management endpoints
 */

/**
 * @swagger
 * /product/inventory/addProduct:
 *   post:
 *     tags:
 *       - Inventory
 *     summary: Add new product
 *     description: Add a new product to inventory
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - quantity
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               quantity:
 *                 type: integer
 *               stockLevel:
 *                 type: integer
 *               category:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product added successfully
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /product/inventory/getAllProducts:
 *   get:
 *     tags:
 *       - Inventory
 *     summary: Get all products
 *     description: Retrieve all products in inventory
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Products retrieved
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /product/inventory/getLowStock:
 *   get:
 *     tags:
 *       - Inventory
 *     summary: Get low stock products
 *     description: Retrieve products with low stock levels
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Low stock products retrieved
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /product/inventory/updateProduct/{productId}:
 *   put:
 *     tags:
 *       - Inventory
 *     summary: Update product
 *     description: Update product details
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               quantity:
 *                 type: integer
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product updated
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /product/inventory/deleteProduct/{productId}:
 *   patch:
 *     tags:
 *       - Inventory
 *     summary: Delete/disable product
 *     description: Delete or disable a product
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /product/inventory/restockProduct/{productId}:
 *   patch:
 *     tags:
 *       - Inventory
 *     summary: Restock product
 *     description: Increase product quantity
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Product restocked
 *       401:
 *         description: Unauthorized
 */

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
