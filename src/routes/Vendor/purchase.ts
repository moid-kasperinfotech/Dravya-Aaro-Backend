import express from "express";
import { authenticateAdmin } from "../../middlewares/authorisation.js";
import {
  addPurchase,
  getPaymentHistory,
  getPurchaseDetails,
  getPurchases,
  makePayment,
} from "../../controllers/Vendor/purchaseController.js";

/**
 * @swagger
 * tags:
 *   - name: Purchases
 *     description: Purchase order and payment management endpoints
 */

/**
 * @swagger
 * /vendor/purchases/addPurchase:
 *   post:
 *     tags:
 *       - Purchases
 *     summary: Create purchase order
 *     description: Create a new purchase order from vendor
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vendorId
 *               - items
 *               - totalAmount
 *             properties:
 *               vendorId:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *               totalAmount:
 *                 type: number
 *               deliveryDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Purchase order created
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
 *         name: skip
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
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
 *     description: Process payment for a purchase order
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
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - paymentMethod
 *             properties:
 *               amount:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *                 enum: [bank_transfer, credit_card, cheque]
 *               referenceNumber:
 *                 type: string
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
 *         name: skip
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Payment history retrieved
 *       401:
 *         description: Unauthorized
 */

const router = express.Router();

router.post("/addPurchase", authenticateAdmin, addPurchase);
router.get("/getPurchases", authenticateAdmin, getPurchases);
router.get(
  "/getPurchaseDetails/:purchaseId",
  authenticateAdmin,
  getPurchaseDetails,
);

router.post("/makePayment/:purchaseId", authenticateAdmin, makePayment);
router.get(
  "/getPaymentHistory/:purchaseId",
  authenticateAdmin,
  getPaymentHistory,
);

export default router;
