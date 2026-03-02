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
 *       - Technician Jobs
 *     summary: Get available jobs
 *     description: Retrieve list of available or assigned jobs for technician
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, accepted, ongoing, completed]
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
 *         description: Jobs retrieved successfully
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
 *     responses:
 *       200:
 *         description: Job cancelled
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
 *             required:
 *               - newScheduleDate
 *             properties:
 *               newScheduleDate:
 *                 type: string
 *                 format: date-time
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Job rescheduled
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *     responses:
 *       200:
 *         description: Job marked as reached
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
 *     responses:
 *       200:
 *         description: Job started
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amountPaid
 *             properties:
 *               amountPaid:
 *                 type: number
 *     responses:
 *       200:
 *         description: Payment completed
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
 *               review:
 *                 type: string
 *     responses:
 *       200:
 *         description: Rating submitted
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