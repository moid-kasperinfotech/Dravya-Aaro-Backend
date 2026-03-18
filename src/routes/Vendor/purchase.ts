import express from "express";
import { authenticateAdmin } from "../../middlewares/authorisation.js";
import {
  addPurchase,
  getPaymentHistory,
  getPurchaseDetails,
  getPurchases,
  makePayment,
} from "../../controllers/Vendor/purchaseController.js";
import upload from "../../middlewares/multer.js";

/**
 * @swagger
 * tags:
 *   - name: Purchases (👇ADMIN APIs)
 *     description: Purchase order and payment management endpoints
 */

/**
 * @swagger
 * /vendor/purchases/addPurchase:
 *   post:
 *     tags:
 *       - Purchases
 *     summary: Create purchase order
 *     description: Create a new purchase order from vendor (receipt required)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - vendorId
 *               - productName
 *               - brand
 *               - category
 *               - warrantyPeriod
 *               - quantity
 *               - unitPrice
 *               - taxPercent
 *               - receipt
 *             properties:
 *               vendorId:
 *                 type: string
 *               productName:
 *                 type: string
 *               brand:
 *                 type: string
 *               category:
 *                 type: string
 *               warrantyPeriod:
 *                 type: string
 *               quantity:
 *                 type: number
 *               unitPrice:
 *                 type: number
 *               taxPercent:
 *                 type: number
 *               additionalCharge:
 *                 type: number
 *               amountPaid:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *                 enum: [CASH, ONLINE]
 *                 description: Payment method
 *               notes:
 *                 type: string
 *               receipt:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Purchase order created
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /vendor/purchases/getPurchases:
 *   get:
 *     tags:
 *       - Purchases
 *     summary: Get purchase orders
 *     description: Retrieve list of all purchase orders
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
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Purchase orders retrieved
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /vendor/purchases/getPurchaseDetails/{purchaseId}:
 *   get:
 *     tags:
 *       - Purchases
 *     summary: Get purchase details
 *     description: Retrieve details of a specific purchase order
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: purchaseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Purchase details retrieved
 *       404:
 *         description: Purchase not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /vendor/purchases/makePayment/{purchaseId}:
 *   post:
 *     tags:
 *       - Purchases
 *     summary: Make payment
 *     description: Process payment for a purchase order (receipt required)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: purchaseId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - paymentMethod
 *               - paymentDate
 *               - receipt
 *             properties:
 *               amount:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *                 enum: [bank_transfer, credit_card, cheque]
 *                 description: Payment method (bank_transfer, credit_card, or cheque)
 *               paymentDate:
 *                 type: string
 *                 format: date-time
 *               referenceNumber:
 *                 type: string
 *               receipt:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Payment processed
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /vendor/purchases/getPaymentHistory/{purchaseId}:
 *   get:
 *     tags:
 *       - Purchases
 *     summary: Get payment history
 *     description: Retrieve payment history for a purchase order
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: purchaseId
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
 *           default: 10
 *     responses:
 *       200:
 *         description: Payment history retrieved
 *       401:
 *         description: Unauthorized
 */

const router = express.Router();

router.post(
  "/addPurchase",
  upload.array("receipt", 5),
  authenticateAdmin,
  addPurchase,
);
router.get("/getPurchases", authenticateAdmin, getPurchases);
router.get(
  "/getPurchaseDetails/:purchaseId",
  authenticateAdmin,
  getPurchaseDetails,
);

router.post(
  "/makePayment/:purchaseId",
  upload.array("receipt", 5),
  authenticateAdmin,
  makePayment,
);
router.get(
  "/getPaymentHistory/:purchaseId",
  authenticateAdmin,
  getPaymentHistory,
);

export default router;
