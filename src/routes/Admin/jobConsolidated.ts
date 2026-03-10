import express from "express";
import { authenticateAdmin } from "../../middlewares/authorisation.js";
import {
  cancelOrRefund,
  markPaymentCollected,
  blacklistTechnician,
  removeBlacklist,
  assignJobToTechnician,
  getJobDetailsFull,
} from "../../controllers/Admin/jobControllerConsolidated.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Admin Job Management (Consolidated)
 *     description: Unified job assignment, cancellation, refunds, and technician management
 */

/**
 * @swagger
 * /admin/job/{jobId}/cancel-or-refund:
 *   post:
 *     tags:
 *       - Admin Job Management (Consolidated)
 *     summary: Cancel or refund job (cancel + refund consolidated)
 *     description: Unified endpoint for job cancellation and refund operations
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
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
 *               - refundType
 *             properties:
 *               refundType:
 *                 type: string
 *                 enum: [full, partial, none]
 *               isRefundOnly:
 *                 type: boolean
 *                 default: false
 *                 description: If true, only refund; if false, cancel and optionally refund
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Job cancelled/refunded successfully
 *       400:
 *         description: Invalid parameters
 *       404:
 *         description: Job not found
 */
router.post("/job/:jobId/cancel-or-refund", authenticateAdmin, cancelOrRefund);

/**
 * @swagger
 * /admin/job/{jobId}/mark-payment-collected:
 *   post:
 *     tags:
 *       - Admin Job Management (Consolidated)
 *     summary: Mark payment as collected for a job
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
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
 *               - paymentMethod
 *             properties:
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, card, upi, other]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment marked as collected
 */
router.post("/job/:jobId/mark-payment-collected", authenticateAdmin, markPaymentCollected);

/**
 * @swagger
 * /admin/job/{jobId}/assign:
 *   post:
 *     tags:
 *       - Admin Job Management (Consolidated)
 *     summary: Assign job to technician
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
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
 *               - technicianId
 *             properties:
 *               technicianId:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Job assigned successfully
 */
router.post("/job/:jobId/assign", authenticateAdmin, assignJobToTechnician);

/**
 * @swagger
 * /admin/job/{jobId}/details:
 *   get:
 *     tags:
 *       - Admin Job Management (Consolidated)
 *     summary: Get complete job details
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
 *         description: Job details retrieved successfully
 *       404:
 *         description: Job not found
 */
router.get("/job/:jobId/details", authenticateAdmin, getJobDetailsFull);

/**
 * @swagger
 * /admin/job/{jobId}/blacklist:
 *   post:
 *     tags:
 *       - Admin Job Management (Consolidated)
 *     summary: Blacklist technician for quality issues
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
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
 *               - technicianId
 *               - reason
 *             properties:
 *               technicianId:
 *                 type: string
 *               reason:
 *                 type: string
 *               duration:
 *                 type: number
 *                 default: 30
 *                 description: Blacklist duration in days
 *     responses:
 *       200:
 *         description: Technician blacklisted successfully
 */
router.post("/job/:technicianId/blacklist", authenticateAdmin, blacklistTechnician);

/**
 * @swagger
 * /admin/job/{jobId}/remove-blacklist:
 *   post:
 *     tags:
 *       - Admin Job Management (Consolidated)
 *     summary: Remove technician from blacklist
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
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
 *               - technicianId
 *             properties:
 *               technicianId:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Technician removed from blacklist
 */
router.post("/job/:technicianId/remove-blacklist", authenticateAdmin, removeBlacklist);

export default router;
