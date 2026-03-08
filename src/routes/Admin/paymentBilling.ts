import express from "express";
import { authenticateAdmin } from "../../middlewares/authorisation.js";
import {
  getStats,
  getTransactions,
  getJobTransactionDetail,
  getOrderTransactionDetail,
  markMoneyReceived,
  processRefund,
  getRefunds,
  getDuePayments,
} from "../../controllers/Admin/paymentBillingController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Admin Payment & Billing
 *     description: Payment transactions, billings, and refund management
 */

/**
 * @swagger
 * /admin/payment-billings/stats:
 *   get:
 *     tags:
 *       - Admin Payment & Billing
 *     summary: Get payment & billing statistics
 *     description: Retrieve dashboard stats (total revenue, refunds, tax, transaction count)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/stats", authenticateAdmin, getStats);

/**
 * @swagger
 * /admin/payment-billings/transactions:
 *   get:
 *     tags:
 *       - Admin Payment & Billing
 *     summary: Get all transactions (jobs & orders)
 *     description: List all transactions with filtering options
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [job, order, all]
 *           default: all
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           default: all
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
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
 *         description: Transactions retrieved successfully
 */
router.get("/transactions", authenticateAdmin, getTransactions);

/**
 * @swagger
 * /admin/payment-billings/jobs/{jobId}:
 *   get:
 *     tags:
 *       - Admin Payment & Billing
 *     summary: Get job transaction details
 *     description: Retrieve complete job transaction information including payment and timeline
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job details retrieved
 *       404:
 *         description: Job not found
 */
router.get("/jobs/:jobId", authenticateAdmin, getJobTransactionDetail);

/**
 * @swagger
 * /admin/payment-billings/orders/{orderId}:
 *   get:
 *     tags:
 *       - Admin Payment & Billing
 *     summary: Get order transaction details
 *     description: Retrieve complete order transaction including items, pricing, and refunds
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order details retrieved
 *       404:
 *         description: Order not found
 */
router.get("/orders/:orderId", authenticateAdmin, getOrderTransactionDetail);

/**
 * @swagger
 * /admin/payment-billings/mark-received:
 *   post:
 *     tags:
 *       - Admin Payment & Billing
 *     summary: Mark money received (collected → paid)
 *     description: Update payment status from collected to paid
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transactionId:
 *                 type: string
 *                 description: Job or Order ID
 *               type:
 *                 type: string
 *                 enum: [job, order]
 *               amount:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, upi, online, check]
 *               notes:
 *                 type: string
 *             required:
 *               - transactionId
 *               - type
 *               - paymentMethod
 *     responses:
 *       200:
 *         description: Payment marked as received
 *       400:
 *         description: Invalid parameters
 */
router.post("/mark-received", authenticateAdmin, markMoneyReceived);

/**
 * @swagger
 * /admin/payment-billings/refund:
 *   post:
 *     tags:
 *       - Admin Payment & Billing
 *     summary: Process refund (partial or full)
 *     description: Create refund record for transaction
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transactionId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [job, order]
 *               refundAmount:
 *                 type: number
 *               reason:
 *                 type: string
 *               refundMethod:
 *                 type: string
 *                 enum: [cash, upi, online, check]
 *             required:
 *               - transactionId
 *               - type
 *               - refundAmount
 *               - reason
 *     responses:
 *       200:
 *         description: Refund processed
 *       400:
 *         description: Invalid parameters
 */
router.post("/refund", authenticateAdmin, processRefund);

/**
 * @swagger
 * /admin/payment-billings/refunds:
 *   get:
 *     tags:
 *       - Admin Payment & Billing
 *     summary: Get all refunds
 *     description: List all refund transactions with filters
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           default: all
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
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
 *         description: Refunds retrieved
 */
router.get("/refunds", authenticateAdmin, getRefunds);

/**
 * @swagger
 * /admin/payment-billings/due-payments:
 *   get:
 *     tags:
 *       - Admin Payment & Billing
 *     summary: Get due payment requests
 *     description: List pending payments (collected but not yet paid to operator)
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
 *     responses:
 *       200:
 *         description: Due payments retrieved
 */
router.get("/due-payments", authenticateAdmin, getDuePayments);

export default router;
