import express from "express";
import {
  authenticateAdmin,
  authenticateTechnician,
} from "../../middlewares/authorisation.js";
import {
  addProduct,
  deleteProduct,
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
  stockOutProduct,
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
 *     summary: Add new product (👇ADMIN API)
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
 *               - description
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
 *               shippingCharge:
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
 *               description:
 *                 type: string
 *               productImages:
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
 *     summary: Get all products (👇ADMIN API)
 *     description: Retrieve all products in inventory (both active and inactive)
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
 *       - in: query
 *         name: filterDate
 *         schema:
 *           type: string
 *           format: date
 *           example: 2024-01-15
 *         description: Filter by specific date
 *       - in: query
 *         name: ActiveStatus
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by product status
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
 *     summary: Get low stock products (👇ADMIN API)
 *     description: Retrieve products with low stock levels
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
 *       - in: query
 *         name: filterDate
 *         schema:
 *           type: string
 *           format: date
 *           example: 2024-01-15
 *         description: Filter by specific date
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
 *     summary: Update product (👇ADMIN API)
 *     description: Update product details with partial update support and image replacement
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
 *         multipart/form-data:
 *           schema:
 *             type: object
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
 *               description:
 *                 type: string
 *               mrp:
 *                 type: number
 *               costPrice:
 *                 type: number
 *               sellingPrice:
 *                 type: number
 *               taxRate:
 *                 type: number
 *               stockLevel:
 *                 type: number
 *               reorderLevel:
 *                 type: number
 *               shippingCharge:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *
 *               discount.discountPercentage:
 *                 type: number
 *               discount.discountAmount:
 *                 type: number
 *
 *               specifications.materialType:
 *                 type: string
 *               specifications.width:
 *                 type: string
 *               specifications.height:
 *                 type: string
 *               specifications.netWeight:
 *                 type: string
 *               specifications.nsfRating:
 *                 type: string
 *
 *               warranty.warrantyPeriod:
 *                 type: string
 *               warranty.warrantyType:
 *                 type: string
 *
 *               image_0:
 *                 type: string
 *                 format: binary
 *               image_1:
 *                 type: string
 *                 format: binary
 *               image_2:
 *                 type: string
 *                 format: binary
 *
 *
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: Invalid data or SKU already exists
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
 *     summary: Delete/disable product (👇ADMIN API)
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
 *     summary: change product status -- isActive-true|false (👇ADMIN API)
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
 *     summary: Restock product (👇ADMIN API)
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

/**
 * @swagger
 * /inventory/stockOutProduct/{productId}:
 *   patch:
 *     tags:
 *       - Inventory
 *     summary: Stock out product (👇ADMIN API)
 *     description: Reduce product stock quantity (for damaged, expired, or removed items)
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
 *                 description: Quantity to remove from stock
 *                 minimum: 1
 *               reason:
 *                 type: string
 *                 description: Reason for stock out (e.g., damaged, expired, lost)
 *                 example: Damaged during storage
 *     responses:
 *       200:
 *         description: Product stock reduced successfully
 *       400:
 *         description: Invalid quantity or insufficient stock
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 */

/**
 * @swagger
 * /inventory/deleteProduct/{productId}:
 *   delete:
 *     tags:
 *       - Inventory
 *     summary: Delete product permanently (👇ADMIN API)
 *     description: Hard delete a product from the system (removes product and all associated images)
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
 *         description: Product deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 */

/**
 * @swagger
 * /inventory/issueProducts/{technicianId}:
 *   post:
 *     tags:
 *       - Inventory
 *     summary: Issue products to technician (👇ADMIN API)
 *     description: Admin issues products to a technician
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: technicianId
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
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *               remarks:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product issued successfully
 *       400:
 *         description: Invalid request or insufficient stock
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product or technician not found
 */

/**
 * @swagger
 * /inventory/getIssuedProducts:
 *   get:
 *     tags:
 *       - Inventory
 *     summary: Get all issued products (👇ADMIN API)
 *     description: Admin view of all products issued to technicians
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by product name or SKU
 *       - in: query
 *         name: dateFilter
 *         schema:
 *           type: string
 *           format: date
 *           example: 2024-01-01
 *     responses:
 *       200:
 *         description: Issued products retrieved
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /inventory/getIssuedProductDetails/{inventoryId}:
 *   get:
 *     tags:
 *       - Inventory
 *     summary: Get issued product details (👇ADMIN API)
 *     description: Admin view of details for a specific issued product
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: inventoryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details retrieved
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Issued product not found
 */

/**
 * @swagger
 * /inventory/getIssuedProductsByTechnician/{technicianId}:
 *   get:
 *     tags:
 *       - Inventory
 *     summary: Get issued products for technician (👇TECHNICIAN API)
 *     description: Technician views their issued products
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: technicianId
 *         required: true
 *         schema:
 *           type: string
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
 *     responses:
 *       200:
 *         description: Issued products retrieved
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /inventory/getIssuedProductDetailsByTechnician/{inventoryId}:
 *   get:
 *     tags:
 *       - Inventory
 *     summary: Get issued product details (👇TECHNICIAN API)
 *     description: Technician views details of a specific issued product
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: inventoryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details retrieved
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not your product
 *       404:
 *         description: Issued product not found
 */

/**
 * @swagger
 * /inventory/returnProductsByTechnician/{technicianId}:
 *   post:
 *     tags:
 *       - Inventory
 *     summary: Return products from technician (👇TECHNICIAN API)
 *     description: Admin processes product return from technician
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: technicianId
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
 *               - inventoryId
 *               - quantity
 *             properties:
 *               inventoryId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *               remarks:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product returned successfully
 *       400:
 *         description: Invalid request or insufficient quantity
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Technician or inventory not found
 */

/**
 * @swagger
 * /inventory/getReturnedProducts:
 *   get:
 *     tags:
 *       - Inventory
 *     summary: Get all returned products (👇ADMIN API)
 *     description: Admin view of all products returned by technicians
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by product name or SKU
 *       - in: query
 *         name: dateFilter
 *         schema:
 *           type: string
 *           format: date
 *           example: 2024-01-01
 *     responses:
 *       200:
 *         description: Returned products retrieved
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /inventory/getReturnedProductsByTechnician/{technicianId}:
 *   get:
 *     tags:
 *       - Inventory
 *     summary: Get returned products for technician (👇TECHNICIAN API)
 *     description: Technician views their returned products
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: technicianId
 *         required: true
 *         schema:
 *           type: string
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
 *     responses:
 *       200:
 *         description: Returned products retrieved
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Technician not found
 */

/**
 * @swagger
 * /inventory/useProductsByTechnician/{technicianId}:
 *   post:
 *     tags:
 *       - Inventory
 *     summary: Use/consume products (👇TECHNICIAN API)
 *     description: Technician marks products as used/consumed during job
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: technicianId
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
 *               - inventoryId
 *               - quantity
 *             properties:
 *               inventoryId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *               remarks:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product usage recorded
 *       400:
 *         description: Invalid request or insufficient quantity
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Technician or inventory not found
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
router.put(
  "/updateProduct/:productId",
  upload.any(),
  authenticateAdmin,
  updateProduct,
);
router.patch(
  "/updateProductStatus/:productId",
  authenticateAdmin,
  updateProductStatus,
);
router.patch("/restockProduct/:productId", authenticateAdmin, restockProduct);
router.patch("/stockOutProduct/:productId", authenticateAdmin, stockOutProduct);
router.delete("/deleteProduct/:productId", authenticateAdmin, deleteProduct);

router.post(
  "/issueProducts/:technicianId",
  authenticateAdmin,
  issueProductsToTechnician,
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
router.get("/getReturnedProducts", authenticateAdmin, getReturnedProducts);

// technician routes
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

router.get(
  "/getReturnedProductsByTechnician/:technicianId",
  authenticateTechnician,
  getReturnedProductsByTechnician,
);

router.post(
  "/useProductsByTechnician/:technicianId",
  authenticateTechnician,
  useProductsByTechnician,
);

export default router;
