import express from "express";
import { authenticateAdmin } from "../../middlewares/authorization.js";
import {
  getPayoutStats,
  getPayoutList,
  getPayoutDetails,
  getTechnicianPayoutJobs,
  markPayoutAsPaid,
} from "../../controllers/Admin/technicianPayoutController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Admin Technician Payout
 *     description: Technician payment tracking and payout management
 */

/**
 * @swagger
 * /admin/technician-payout/stats:
 *   get:
 *     tags:
 *       - Admin Technician Payout
 *     summary: Get payout statistics dashboard
 *     description: Retrieve total payable, pending, paid amounts and active technician count
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         description: Statistics period (week=last 7 days, month=last 30 days)
 *         schema:
 *           type: string
 *           enum: [week, month]
 *           default: week
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/stats", authenticateAdmin, getPayoutStats);

/**
 * @swagger
 * /admin/technician-payout/list:
 *   get:
 *     tags:
 *       - Admin Technician Payout
 *     summary: Get all technicians with due/paid amounts
 *     description: List technicians with their total earnings, payments received, and net payable
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         description: Payout status filter (pending=awaiting payment, paid=processed, on-hold=temporarily held, all=any status)
 *         schema:
 *           type: string
 *           enum: [pending, paid, on-hold, all]
 *           default: all
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
 *         name: sortBy
 *         description: Sort by field (netPayable=total due, dueAmount=pending amount, lastPayment=recent payment date)
 *         schema:
 *           type: string
 *           enum: [netPayable, dueAmount, lastPayment]
 *     responses:
 *       200:
 *         description: Technician list retrieved
 *       401:
 *         description: Unauthorized
 */
router.get("/list", authenticateAdmin, getPayoutList);

/**
 * @swagger
 * /admin/technician-payout/{technicianId}/details:
 *   get:
 *     tags:
 *       - Admin Technician Payout
 *     summary: Get technician payout details
 *     description: Retrieve full technician profile with earnings breakdown, payment history, and job summary
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: technicianId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Technician details retrieved
 *       404:
 *         description: Technician not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:technicianId/details", authenticateAdmin, getPayoutDetails);

/**
 * @swagger
 * /admin/technician-payout/{technicianId}/jobs:
 *   get:
 *     tags:
 *       - Admin Technician Payout
 *     summary: Get technician's jobs with earnings
 *     description: List all jobs assigned to technician with payment status and refund info
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: technicianId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [completed, ongoing, all]
 *           default: all
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
 *         description: Jobs list retrieved
 *       404:
 *         description: Technician not found
 */
router.get("/:technicianId/jobs", authenticateAdmin, getTechnicianPayoutJobs);

/**
 * @swagger
 * /admin/technician-payout/mark-paid:
 *   post:
 *     tags:
 *       - Admin Technician Payout
 *     summary: Mark technician payout as paid
 *     description: Record a payment made to technician with date, amount, and method
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               technicianId:
 *                 type: string
 *                 description: Technician ID
 *               amount:
 *                 type: number
 *                 description: Payment amount in rupees
 *               paymentMethod:
 *                 type: string
 *                 enum: [bank_transfer, cash, check, upi]
 *               transactionId:
 *                 type: string
 *                 description: Bank/payment transaction ID
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Payment date (defaults to today)
 *               notes:
 *                 type: string
 *             required:
 *               - technicianId
 *               - amount
 *               - paymentMethod
 *     responses:
 *       200:
 *         description: Payout marked as paid
 *       400:
 *         description: Invalid parameters
 *       404:
 *         description: Technician not found
 *       401:
 *         description: Unauthorized
 */
router.post("/mark-paid", authenticateAdmin, markPayoutAsPaid);

export default router;
