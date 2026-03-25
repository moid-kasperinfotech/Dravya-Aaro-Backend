import express from "express";
import { authenticateTechnician, authenticateUser } from "../../middlewares/authorisation.js";

import {
  acceptJobController,
  approveQuotationController,
  cancelJobController,
  completeJobController,
  completeJobServiceController,
  completePaymentCashController,
  createQuoteController,
  getJobByIdController,
  getJobController,
  getQuotationController,
  getQuotationSummaryController,
  ratingByTechnicianController,
  ratingByUserToTechnician,
  reachedJobController,
  rejectQuotationController,
  rescheduleJobController,
  startJobController,
  startJobServicesController,
} from "../../controllers/Technician/jobController.js";

/**
 * @swagger
 * tags:
 *   - name: Technician Jobs (👇TECHNICIAN APIs)
 *     description: Technician job management endpoints
 */

/**
 * @swagger
 * /technician/job:
 *   get:
 *     tags:
 *       - Technician Jobs (👇TECHNICIAN APIs) 
 *     summary: Get jobs with filtering
 *     description: Retrieve list of technician jobs filtered by type or status. Type parameter provides convenient filtering for common job lists (pending, assigned, completed, history).
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         description: Filter by job type (pending, assigned, completed, or history)
 *         schema:
 *           type: string
 *           enum: [pending, assigned, completed, history]
 *       - in: query
 *         name: status
 *         description: Alternative filter by exact job status
 *         schema:
 *           type: string
 *           enum: [pending, assigned, reached, in_progress, completed, cancelled, rescheduled, fullAndPaid]
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
 *         description: Jobs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     jobs:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /technician/job/{jobId}:
 *   post:
 *     tags:
 *       - Technician Jobs (👇TECHNICIAN APIs)
 *     summary: Get job details
 *     description: Get detailed information about a specific job
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 job:
 *                   type: object
 *       404:
 *         description: Job not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /technician/job/{jobId}/accept:
 *   post:
 *     tags:
 *       - Technician Jobs (👇TECHNICIAN APIs)
 *     summary: Accept job
 *     description: Accept a job assignment
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
 *         description: Job accepted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Job is not pending or account type not eligible
 *       404:
 *         description: Job not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /technician/job/{jobId}/cancel:
 *   post:
 *     tags:
 *       - Technician Jobs (👇TECHNICIAN APIs)
 *     summary: Cancel job
 *     description: Cancel a job assignment
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
 *               additionalInfo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Job cancelled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Job not assigned or cannot be cancelled within 3 hours of start time
 *       404:
 *         description: Job not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /technician/job/{jobId}/reschedule:
 *   post:
 *     tags:
 *       - Technician Jobs (👇TECHNICIAN APIs)
 *     summary: Reschedule job
 *     description: Reschedule job to different date/time
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
 *               additionalInfo:
 *                 type: string
 *               preferredDateByTechnician:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Job rescheduled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Job not assigned or cannot be rescheduled
 *       404:
 *         description: Job not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /technician/job/{jobId}/reached:
 *   post:
 *     tags:
 *       - Technician Jobs (👇TECHNICIAN APIs)
 *     summary: Mark job as reached
 *     description: Technician has reached the job location
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
 *         description: Job marked as reached
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Job not assigned or cannot be marked as reached
 *       404:
 *         description: Job not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /technician/job/{jobId}/start:
 *   post:
 *     tags:
 *       - Technician Jobs (👇TECHNICIAN APIs)
 *     summary: Start job
 *     description: Start working on the job
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
 *               otp:
 *                 type: string
 *             required:
 *               - otp
 *     responses:
 *       200:
 *         description: Job started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid OTP or job status
 *       404:
 *         description: Job not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /technician/job/{jobId}/complete:
 *   post:
 *     tags:
 *       - Technician Jobs (👇TECHNICIAN APIs)
 *     summary: Complete job
 *     description: Mark job as completed
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
 *               remarks:
 *                 type: string
 *               amountCharged:
 *                 type: number
 *     responses:
 *       200:
 *         description: Job completed
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /technician/job/{jobId}/complete/payment/cash:
 *   post:
 *     tags:
 *       - Technician Jobs (👇TECHNICIAN APIs)
 *     summary: Complete cash payment
 *     description: Complete payment collection from customer
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: amount
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Payment completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 info:
 *                   type: object
 *                   properties:
 *                     amount:
 *                       type: number
 *                     method:
 *                       type: string
 *                     time:
 *                       type: string
 *                       format: date-time
 *                     jobId:
 *                       type: string
 *       400:
 *         description: Invalid amount or job status
 *       404:
 *         description: Job not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /technician/job/{jobId}/complete/rating:
 *   post:
 *     tags:
 *       - Technician Jobs (👇TECHNICIAN APIs)
 *     summary: Rate user and job
 *     description: Technician rating for user and job
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
 *               - rating
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               additionalComment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Rating submitted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 info:
 *                   type: object
 *                   properties:
 *                     rating:
 *                       type: number
 *                     time:
 *                       type: string
 *                       format: date-time
 *                     jobId:
 *                       type: string
 *       400:
 *         description: Job not completed, not paid, or not assigned to technician
 *       404:
 *         description: Job not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /technician/job/{jobId}/reschedule-request:
 *   post:
 *     tags:
 *       - Technician Jobs (👇TECHNICIAN APIs) 
 *     summary: Submit reschedule request
 *     description: Technician requests to reschedule an assigned job (Phase 3)
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
 *               - reason
 *               - requestedDate
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for requesting reschedule
 *               requestedDate:
 *                 type: string
 *                 format: date-time
 *                 description: New preferred date and time for the job
 *     responses:
 *       200:
 *         description: Reschedule request submitted successfully
 *       400:
 *         description: Invalid request or job cannot be rescheduled
 *       404:
 *         description: Job not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /technician/job/{jobId}/start-install:
 *   post:
 *     tags:
 *       - Technician Jobs (👇TECHNICIAN APIs) 
 *     summary: Start install phase for relocation jobs
 *     description: For relocation jobs after uninstall completion, technician verifies presence at new location and starts install phase (Phase 4)
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
 *               - otp
 *             properties:
 *               otp:
 *                 type: string
 *                 description: OTP sent for install phase verification
 *     responses:
 *       200:
 *         description: Install phase started successfully
 *       400:
 *         description: Invalid OTP or not a relocation job in install phase
 *       404:
 *         description: Job not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /technician/job/{jobId}/rate-technician:
 *   post:
 *     tags:
 *       - Technician Jobs (👇USER APIs)
 *     summary: Rate technician for a completed job
 *     description: User can submit rating and review for the technician after job completion and payment. Only one rating allowed per job.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *               - comment
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               comment:
 *                 type: string
 *                 example: Technician was very professional and completed the job efficiently
 *     responses:
 *       201:
 *         description: Technician rating submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Technician rating submitted
 *                 review:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     userId:
 *                       type: string
 *                     jobId:
 *                       type: string
 *                     technicianId:
 *                       type: string
 *                     serviceId:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *                     rating:
 *                       type: number
 *                     comment:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error / Job not completed / Payment not done / Already rated
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Job not found
 */

const router = express.Router();

// (👇TECHNICIAN APIs)
router.get("/", authenticateTechnician, getJobController);
router.post("/:jobId", authenticateTechnician, getJobByIdController);
router.post("/:jobId/accept", authenticateTechnician, acceptJobController);
router.post("/:jobId/cancel", authenticateTechnician, cancelJobController);
router.post("/:jobId/reschedule", authenticateTechnician, rescheduleJobController);
// router.post("/:jobId/reschedule-request", authenticateTechnician, submitRescheduleRequestController);
router.post("/:jobId/reached", authenticateTechnician, reachedJobController);
router.post("/:jobId/start", authenticateTechnician, startJobController);
router.post("/:jobId/:serviceId/start", authenticateTechnician, startJobServicesController)
router.post("/:jobId/:serviceId/complete", authenticateTechnician, completeJobServiceController)
// router.post("/:jobId/start-install", authenticateTechnician, startInstallPhaseController);
router.post("/:jobId/complete", authenticateTechnician, completeJobController);
router.post("/:jobId/complete/payment/cash", authenticateTechnician, completePaymentCashController);
router.post("/:jobId/complete/rating", authenticateTechnician, ratingByTechnicianController);
router.post("/:jobId/rate-technician", authenticateUser, ratingByUserToTechnician)

router.post("/createQuote", authenticateTechnician, createQuoteController)
router.get("/getQuotationSummary/:quotationId", authenticateTechnician, getQuotationSummaryController)

// (👇USER APIs)
router.get("/getQuotation/", authenticateUser, getQuotationController)
router.post("/rejectQuotation/:quotationId", authenticateUser, rejectQuotationController)
router.post("/approveQuotation/:quotationId", authenticateUser, approveQuotationController)

export default router;