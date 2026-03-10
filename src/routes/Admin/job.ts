import express from "express";
import { authenticateAdmin } from "../../middlewares/authorisation.js";
import {
  refundJobController,
  markPaymentCollectedController,
  blacklistTechnicianController,
  removeBlacklistController,
  approveRescheduleController,
  assignJobToTechnician,
  cancelJobFromQueue,
  getJobDetailsFull,
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
 *                 description: Reason for blacklisting technician
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

/**
 * @swagger
 * /admin/job/{jobId}/assign:
 *   post:
 *     tags:
 *       - Admin Jobs (new)
 *     summary: Assign job to technician
 *     description: Assign a pending job to an available technician from the live job queue
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job MongoDB ObjectId
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
 *                 description: Technician MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Job assigned to technician successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     jobId:
 *                       type: string
 *                     technicianId:
 *                       type: string
 *                     technicianName:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [assigned]
 *                     assignedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Technician is blacklisted, offline, or not available
 *       404:
 *         description: Job or Technician not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /admin/job/{jobId}/cancel:
 *   post:
 *     tags:
 *       - Admin Jobs (new)
 *     summary: Cancel job from queue
 *     description: Cancel a pending or assigned job from the live queue with optional refund processing
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job MongoDB ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for cancellation
 *                 default: Cancelled by admin
 *     responses:
 *       200:
 *         description: Job cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     jobId:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [cancelled]
 *                     paymentStatus:
 *                       type: string
 *                     refundStatus:
 *                       type: string
 *                     cancelledAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Job status does not allow cancellation
 *       404:
 *         description: Job not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /admin/job/{jobId}/details:
 *   get:
 *     tags:
 *       - Admin Jobs (new)
 *     summary: Get full job details
 *     description: Retrieve comprehensive job details including customer, technician, services, quotation, pricing, scheduling, and complete job timeline
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Job details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     job:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         jobId:
 *                           type: string
 *                         jobName:
 *                           type: string
 *                         jobType:
 *                           type: string
 *                         status:
 *                           type: string
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *                     customer:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         mobileNumber:
 *                           type: string
 *                         email:
 *                           type: string
 *                     technician:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         _id:
 *                           type: string
 *                         technicianId:
 *                           type: string
 *                         fullName:
 *                           type: string
 *                         mobileNumber:
 *                           type: string
 *                         averageRating:
 *                           type: number
 *                         yearsOfExperience:
 *                           type: integer
 *                     services:
 *                       type: array
 *                       items:
 *                         type: object
 *                     serviceDetails:
 *                       type: object
 *                       properties:
 *                         brandName:
 *                           type: string
 *                         modelType:
 *                           type: string
 *                         problems:
 *                           type: array
 *                         remarkByUser:
 *                           type: string
 *                     quotation:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         _id:
 *                           type: string
 *                         quotationId:
 *                           type: string
 *                         status:
 *                           type: string
 *                         pricingBreakdown:
 *                           type: object
 *                     pricing:
 *                       type: object
 *                       properties:
 *                         totalPrice:
 *                           type: number
 *                         totalDuration:
 *                           type: number
 *                         paymentStatus:
 *                           type: string
 *                         paymentCollectionStatus:
 *                           type: string
 *                     scheduling:
 *                       type: object
 *                       properties:
 *                         preferredDate:
 *                           type: string
 *                           format: date-time
 *                         assignedAt:
 *                           type: string
 *                           format: date-time
 *                         rescheduleRequest:
 *                           type: object
 *                           nullable: true
 *                     timeline:
 *                       type: array
 *                       description: Complete job status timeline
 *                       items:
 *                         type: object
 *                     rating:
 *                       type: object
 *                       nullable: true
 *       404:
 *         description: Job not found
 *       500:
 *         description: Server error
 */

const router = express.Router();

router.post("/job/:jobId/refund", authenticateAdmin, refundJobController);
router.post("/job/:jobId/mark-collected", authenticateAdmin, markPaymentCollectedController);
router.post("/job/:jobId/approve-reschedule", authenticateAdmin, approveRescheduleController);
router.post("/technician/:technicianId/blacklist", authenticateAdmin, blacklistTechnicianController);
router.post("/technician/:technicianId/remove-blacklist", authenticateAdmin, removeBlacklistController);
router.post("/job/:jobId/assign", authenticateAdmin, assignJobToTechnician);
router.post("/job/:jobId/cancel", authenticateAdmin, cancelJobFromQueue);
router.get("/job/:jobId/details", authenticateAdmin, getJobDetailsFull);

export default router;
