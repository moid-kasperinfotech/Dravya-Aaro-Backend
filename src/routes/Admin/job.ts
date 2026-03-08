import express from "express";
import { authenticateAdmin } from "../../middlewares/authorisation.js";
import {
  refundJobController,
  markPaymentCollectedController,
  blacklistTechnicianController,
  removeBlacklistController,
  approveRescheduleController,
} from "../../controllers/Admin/jobController.js";

/**
 * @swagger
 * tags:
 *   - name: Admin Jobs (new)
 *     description: Admin job management, refunds, and technician blacklisting
 */

/**
 * @swagger
 * /admin/job/{jobId}/refund:
 *   post:
 *     tags:
 *       - Admin Jobs (new)
 *     summary: Process job refund
 *     description: Process refund for prepaid jobs (auto-refund after 3 days, or manual refund)
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
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for refund
 *     responses:
 *       200:
 *         description: Refund processed successfully
 *       400:
 *         description: Invalid job status or not a prepaid job
 *       404:
 *         description: Job not found
 */

/**
 * @swagger
 * /admin/job/{jobId}/mark-collected:
 *   post:
 *     tags:
 *       - Admin Jobs (new)
 *     summary: Mark payment collected from technician
 *     description: Mark cash payment as collected from technician
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
 *               - paymentAmount
 *               - paymentMethod
 *             properties:
 *               paymentAmount:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *               transactionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment marked as collected
 *       400:
 *         description: Invalid job status
 *       404:
 *         description: Job not found
 */

/**
 * @swagger
 * /admin/technician/{technicianId}/blacklist:
 *   post:
 *     tags:
 *       - Admin Jobs (new)
 *     summary: Blacklist technician
 *     description: Blacklist technician for not collecting payment within 7 days
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
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 enum: ["pending_payment", "payment_collection_failure", "bad_conduct"]
 *     responses:
 *       200:
 *         description: Technician blacklisted successfully
 *       404:
 *         description: Technician not found
 */

/**
 * @swagger
 * /admin/technician/{technicianId}/remove-blacklist:
 *   post:
 *     tags:
 *       - Admin Jobs (new)
 *     summary: Remove technician from blacklist
 *     description: Remove blacklist restriction from technician
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
 *         description: Technician removed from blacklist
 *       400:
 *         description: Technician is not blacklisted
 *       404:
 *         description: Technician not found
 */

/**
 * @swagger
 * /admin/job/{jobId}/approve-reschedule:
 *   post:
 *     tags:
 *       - Admin Jobs (new)
 *     summary: Approve or reject reschedule request
 *     description: Admin can approve or reject pending reschedule requests from technicians
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
 *               - approved
 *             properties:
 *               approved:
 *                 type: boolean
 *                 description: Whether to approve (true) or reject (false) the reschedule
 *               reason:
 *                 type: string
 *                 description: Reason for rejection (required if approved=false)
 *     responses:
 *       200:
 *         description: Reschedule request processed successfully
 *       400:
 *         description: Invalid request or no pending reschedule request
 *       404:
 *         description: Job not found
 */

const router = express.Router();

router.post("/job/:jobId/refund", authenticateAdmin, refundJobController);
router.post("/job/:jobId/mark-collected", authenticateAdmin, markPaymentCollectedController);
router.post("/job/:jobId/approve-reschedule", authenticateAdmin, approveRescheduleController);
router.post("/technician/:technicianId/blacklist", authenticateAdmin, blacklistTechnicianController);
router.post("/technician/:technicianId/remove-blacklist", authenticateAdmin, removeBlacklistController);

export default router;
