import express from "express";
import {
  authenticateAdmin,
  authenticateTechnician,
} from "../../middlewares/authorisation.js";
import {
  addProduct,
  getAllProducts,
  getIssuedProductDetails,
  getIssuedProductDetailsByTechnician,
  getIssuedProducts,
  getIssuedProductsByTechnician,
  getLowStockProducts,
  getReturnedProducts,
  getReturnedProductsByTechnician,
  issueProductsToTechnician,
  restockProduct,
  returnProductsByTechnician,
  updateProduct,
  updateProductStatus,
  useProductsByTechnician,
} from "../../controllers/Product/inventoryController.js";
import upload from "../../middlewares/multer.js";

/**
 * @swagger
 * tags:
 *   - name: Inventory
 *     description: Inventory management endpoints
 */

/**
 * @swagger
 * /inventory/addProduct:
 *   post:
 *     tags:
 *       - Inventory
 *     summary: Add new product
 *     description: Add a new product to inventory (images required)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - productName
 *               - sku
 *               - category
 *               - brandName
 *               - modelNumber
 *               - modelType
 *               - mrp
 *               - costPrice
 *               - sellingPrice
 *               - taxRate
 *               - stockLevel
 *               - materialType
 *               - width
 *               - height
 *               - netWeight
 *               - nsfRating
 *               - warrantyPeriod
 *               - warrantyType
 *               - isActive
 *             properties:
 *               productName:
 *                 type: string
 *               sku:
 *                 type: string
 *               category:
 *                 type: string
 *               brandName:
 *                 type: string
 *               modelNumber:
 *                 type: string
 *               modelType:
 *                 type: string
 *               mrp:
 *                 type: number
 *               costPrice:
 *                 type: number
 *               sellingPrice:
 *                 type: number
 *               discountPercentage:
 *                 type: number
 *               discountAmount:
 *                 type: number
 *               taxRate:
 *                 type: number
 *               stockLevel:
 *                 type: number
 *               reorderLevel:
 *                 type: number
 *               materialType:
 *                 type: string
 *               width:
 *                 type: number
 *               height:
 *                 type: number
 *               netWeight:
 *                 type: number
 *               nsfRating:
 *                 type: number
 *               warrantyPeriod:
 *                 type: string
 *               warrantyType:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Product added successfully
 *       400:
 *         description: Bad request or missing fields
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /inventory/getAllProducts:
 *   get:
 *     tags:
 *       - Inventory
 *     summary: Get all products
 *     description: Retrieve all products in inventory
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
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
 * /inventory/getLowStock:
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
 * /inventory/updateProduct/{productId}:
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
 *               productName:
 *                 type: string
 *               category:
 *                 type: string
 *               brandName:
 *                 type: string
 *               modelNumber:
 *                 type: string
 *               modelType:
 *                 type: string
 *               mrp:
 *                 type: number
 *               costPrice:
 *                 type: number
 *               sellingPrice:
 *                 type: number
 *               discountPercentage:
 *                 type: number
 *               discountAmount:
 *                 type: number
 *               taxRate:
 *                 type: number
 *               stockLevel:
 *                 type: number
 *               reorderLevel:
 *                 type: number
 *               materialType:
 *                 type: string
 *               width:
 *                 type: number
 *               height:
 *                 type: number
 *               netWeight:
 *                 type: number
 *               nsfRating:
 *                 type: number
 *               warrantyPeriod:
 *                 type: string
 *               warrantyType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: No fields to update or invalid data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 */

/**
 * @swagger
 * /inventory/deleteProduct/{productId}:
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
 * /inventory/updateProductStatus/{productId}:
 *   patch:
 *     tags:
 *       - Inventory
 *     summary: change product status -- isActive-true|false
 *     description: Change status of a product
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
 *         description: Product status changed
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /inventory/restockProduct/{productId}:
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
router.post(
  "/addProduct",
  upload.array("productImages", 10),
  authenticateAdmin,
  addProduct,
);
router.get("/getAllProducts", authenticateAdmin, getAllProducts);
router.get("/getLowStock", authenticateAdmin, getLowStockProducts);
router.put("/updateProduct/:productId", authenticateAdmin, updateProduct);
router.delete(
  "/deleteProduct/:productId",
  authenticateAdmin,
  updateProductStatus,
);
router.patch(
  "/updateProductStatus/:productId",
  authenticateAdmin,
  updateProductStatus,
);
router.patch("/restockProduct/:productId", authenticateAdmin, restockProduct);

// technician routes
router.post(
  "/issueProducts/:technicianId",
  authenticateAdmin,
  issueProductsToTechnician,
);
router.get(
  "/getIssuedProductsByTechnician/:technicianId",
  authenticateTechnician,
  getIssuedProductsByTechnician,
);
router.get(
  "/getIssuedProductDetailsByTechnician/:inventoryId",
  authenticateTechnician,
  getIssuedProductDetailsByTechnician,
);
router.get("/getIssuedProducts", authenticateAdmin, getIssuedProducts);
router.get(
  "/getIssuedProductDetails/:inventoryId",
  authenticateAdmin,
  getIssuedProductDetails,
);
router.post(
  "/returnProductsByTechnician/:technicianId",
  authenticateAdmin,
  returnProductsByTechnician,
);
router.get(
  "/getReturnedProductsByTechnician/:technicianId",
  authenticateTechnician,
  getReturnedProductsByTechnician,
);
router.get("/getReturnedProducts", authenticateAdmin, getReturnedProducts);
router.post(
  "/useProductsByTechnician/:technicianId",
  authenticateTechnician,
  useProductsByTechnician,
);

export default router;
