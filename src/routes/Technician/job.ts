import express from "express";
import { authenticateTechnician } from "../../middlewares/authorisation.js";
import { acceptJobController, cancelJobController, completeJobController, completePaymentCashController, getJobByIdController, getJobController, ratingByTechnicianController, reachedJobController, rescheduleJobController, startJobController } from "../../controllers/Technician/jobController.js";

/**
 * @swagger
 * tags:
 *   - name: Technician Jobs
 *     description: Technician job management endpoints
 */

/**
 * @swagger
 * /technician/job:
 *   get:
 *     tags:
 *       - Technician Jobs (new)
 *     summary: Get jobs with filtering
 *     description: Retrieve list of technician jobs filtered by type or status. Type parameter provides convenient filtering for common job lists (pending, assigned, completed, history).
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [pending, assigned, completed, history]
 *         description: |
 *           - pending: Available jobs not yet assigned to this technician
 *           - assigned: Jobs assigned to this technician (not completed)
 *           - completed: Jobs completed by this technician
 *           - history: Job history (completed and cancelled jobs)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, completed, cancelled]
 *         description: Alternative to 'type' parameter - filter by exact job status (for backward compatibility)
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
 *       - Technician Jobs
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
 *       - Technician Jobs
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
 *       - Technician Jobs
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
 *       - Technician Jobs
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
 *       - Technician Jobs
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
 *       - Technician Jobs
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
 *       - Technician Jobs
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
 *       - Technician Jobs
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
 *       - Technician Jobs
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

const router = express.Router();

router.get("/", authenticateTechnician, getJobController);
router.post("/:jobId", authenticateTechnician, getJobByIdController);
router.post("/:jobId/accept", authenticateTechnician, acceptJobController);
router.post("/:jobId/cancel", authenticateTechnician, cancelJobController);
router.post("/:jobId/reschedule", authenticateTechnician, rescheduleJobController);
router.post("/:jobId/reached", authenticateTechnician, reachedJobController);
router.post("/:jobId/start", authenticateTechnician, startJobController);
router.post("/:jobId/complete", authenticateTechnician, completeJobController);
router.post("/:jobId/complete/payment/cash", authenticateTechnician, completePaymentCashController);
router.post("/:jobId/complete/rating", authenticateTechnician, ratingByTechnicianController);

export default router;