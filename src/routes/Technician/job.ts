import express from "express";
import {
  authenticateTechnician,
  authenticateUser,
} from "../../middlewares/authorisation.js";

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
  submitPaymentCollectionController,
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
 *   get:
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
 *     summary: Accept a job
 *     description:
 *       Technician accepts a pending job.
 *       - Blacklisted technicians cannot accept jobs
 *       - Salaried technicians are not allowed to accept jobs
 *       - Only jobs in "pending" status can be accepted
 *       - Prepaid jobs assigned after 24 hours may trigger admin alerts
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID to accept
 *     responses:
 *       200:
 *         description: Job accepted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Job accepted successfully
 *       400:
 *         description: Job is not pending or technician account type is not eligible
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Job is not pending
 *       403:
 *         description: Technician is blacklisted and cannot accept jobs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: You are blacklisted and cannot accept jobs
 *                 reason:
 *                   type: string
 *                   example: Policy violation
 *                 blacklistedAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Job or Technician not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Job not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /technician/job/{jobId}/cancel:
 *   post:
 *     tags:
 *       - Technician Jobs (👇TECHNICIAN APIs)
 *     summary: Cancel or reschedule a job
 *     description:
 *       Technician can request job cancellation or reschedule based on timing:
 *       - If more than 3 hours remain before job start → cancellation request is sent to admin
 *       - If less than 3 hours remain → only reschedule request is allowed
 *       - Job must be in "assigned" state and assigned to the technician
 *       - Cannot cancel or reschedule after job has started
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
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 example: Customer not available
 *               additionalInfo:
 *                 type: string
 *                 example: Tried calling multiple times but no response
 *               requestedDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-03-30T10:00:00.000Z
 *     responses:
 *       200:
 *         description: Cancellation or reschedule request submitted successfully
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
 *                   example: Cancellation request sent to admin
 *                 type:
 *                   type: string
 *                   enum: [cancel_request, reschedule_request]
 *                   example: cancel_request
 *       400:
 *         description: Validation error / Job not assigned / Job already started / Invalid state
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Only assigned jobs can be modified
 *       403:
 *         description: Job is not assigned to the technician
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Job is not assigned to you
 *       404:
 *         description: Job not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Job not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /technician/job/{jobId}/reschedule:
 *   post:
 *     tags:
 *       - Technician Jobs (👇TECHNICIAN APIs)
 *     summary: Request job reschedule
 *     description:
 *       Technician can request to reschedule a job:
 *       - Job must be assigned to the technician
 *       - Only jobs in "assigned" state can be rescheduled
 *       - A reschedule request is sent to the user for approval
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
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 example: Personal emergency
 *               additionalInfo:
 *                 type: string
 *                 example: Need to attend urgent work
 *               preferredDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-03-30T10:00:00.000Z
 *     responses:
 *       200:
 *         description: Reschedule request submitted successfully
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
 *                   example: Job rescheduled requested successfully
 *       400:
 *         description: Job not assigned to technician or invalid job status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Job is not assigned to you
 *       404:
 *         description: Job not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Job not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /technician/job/{jobId}/reached:
 *   post:
 *     tags:
 *       - Technician Jobs (👇TECHNICIAN APIs)
 *     summary: Mark job as reached and generate OTP
 *     description:
 *       Technician marks the job as reached at customer's location:
 *       - Job must be assigned to the technician
 *       - Only jobs in "assigned" state can be marked as reached
 *       - System generates an OTP for customer verification
 *       - OTP is returned only in dev/test environment
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Job marked as reached and OTP generated
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
 *                   example: Technician reached successfully and OTP sent to customer
 *                 otp:
 *                   type: string
 *                   example: "1234"
 *                   description: OTP visible only in dev/test environment, masked in production
 *       400:
 *         description: Job not assigned to technician or invalid job status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Job is not assigned to you
 *       404:
 *         description: Job not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Job not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /technician/job/{jobId}/start:
 *   post:
 *     tags:
 *       - Technician Jobs (👇TECHNICIAN APIs)
 *     summary: Start job with OTP verification
 *     description:
 *       Technician starts the job after reaching the location:
 *       - Job must be assigned to the technician
 *       - Job status must be "reached"
 *       - OTP verification is required to start the job
 *       - If any service requires quotation:
 *         - Quotation must exist
 *         - Quotation must be approved by customer
 *         - If quotation is rejected → job gets cancelled
 *       - On successful start:
 *         - Job status changes to "in_progress"
 *         - Completion OTP is generated for job completion
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
 *               - otp
 *             properties:
 *               otp:
 *                 type: string
 *                 example: "1234"
 *                 description: OTP received by customer when technician reached
 *     responses:
 *       200:
 *         description: Job started successfully and completion OTP generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Job started successfully and OTP sent to customer
 *                 nextOtp:
 *                   type: string
 *                   example: "5678"
 *                   description: Completion OTP (visible only in dev/test environment)
 *       400:
 *         description: Validation error / Invalid OTP / Quotation issue / Invalid job status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Invalid OTP
 *       404:
 *         description: Job not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Job not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /technician/job/{jobId}/{serviceId}/start:
 *   post:
 *     tags:
 *       - Technician Jobs (👇TECHNICIAN APIs)
 *     summary: Start a specific service within a job
 *     description:
 *       Technician starts an individual service inside a job:
 *       - Job must be assigned to the technician
 *       - Job must be in "reached" or "in_progress" state
 *       - Service must exist inside the job and be in "pending" state
 *
 *       🔹 For normal services (repair):
 *       - Service status changes to "in_progress"
 *       - Job step "repair started" is recorded
 *
 *       🔹 For relocation services (installation-uninstallation):
 *       - First pending sub-service (install/uninstall) is started
 *       - Sub-service status becomes "in_progress"
 *       - Job stepStatuses updated accordingly (install/uninstall)
 *       - Step history is recorded
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Service ID inside the job
 *     responses:
 *       200:
 *         description: Service started successfully
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
 *                   example: Repair service started successfully
 *       400:
 *         description: Validation error / Invalid job state / Service already started / Missing IDs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Job not in valid state
 *       404:
 *         description: Job or Service not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Service not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /technician/job/{jobId}/{serviceId}/complete:
 *   post:
 *     tags:
 *       - Technician Jobs (👇TECHNICIAN APIs)
 *     summary: Complete a specific service within a job
 *     description:
 *       Technician completes an individual service inside a job:
 *       - Job must be assigned to the technician
 *       - Job must be in "reached" or "in_progress" state
 *       - Service must exist inside the job
 *
 *       🔹 For normal services (repair):
 *       - Service status changes to "completed"
 *       - Job step "repair completed" is recorded
 *
 *       🔹 For relocation services (installation-uninstallation):
 *       - Current active sub-service (install/uninstall) is completed
 *       - stepStatuses updated accordingly
 *       - Step history is recorded
 *       - If next sub-service exists → it automatically starts
 *       - If no sub-service left → service marked as completed
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Service ID inside the job
 *     responses:
 *       200:
 *         description: Service or step completed successfully
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
 *                   example: Uninstall completed successfully
 *       400:
 *         description: Validation error / Invalid job state / No active step found / Missing IDs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: No active step found
 *       404:
 *         description: Job or Service not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Service not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /technician/job/{jobId}/complete:
 *   post:
 *     tags:
 *       - Technician Jobs (👇TECHNICIAN APIs)
 *     summary: Complete job with OTP verification
 *     description:
 *       Technician completes the job after finishing all services:
 *       - Job must be assigned to the technician
 *       - Job status must be "in_progress"
 *       - All services inside the job must be completed
 *       - OTP verification is required to complete the job
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
 *               - otp
 *             properties:
 *               otp:
 *                 type: string
 *                 example: "5678"
 *                 description: Completion OTP provided by customer
 *     responses:
 *       200:
 *         description: Job completed successfully
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
 *                   example: Job completed successfully
 *       400:
 *         description: Validation error / Invalid OTP / Job not in valid state / Services incomplete
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Please complete all services before completing the job
 *       404:
 *         description: Job not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Job not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /technician/job/{jobId}/complete/payment/cash:
 *   post:
 *     tags:
 *       - Technician Jobs (👇TECHNICIAN APIs)
 *     summary: Complete job payment via cash
 *     description:
 *       Technician collects cash payment from customer after job completion:
 *       - Job must be assigned to the technician
 *       - Job status must be "completed"
 *       - Payment must not be prepaid
 *       - Entered amount must match final job price
 *       - On success, job status becomes "fullAndPaid"
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
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 499
 *                 description: Final amount collected from customer
 *     responses:
 *       200:
 *         description: Payment collected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Job paid successfully
 *                 info:
 *                   type: object
 *                   properties:
 *                     amount:
 *                       type: number
 *                       example: 499
 *                     method:
 *                       type: string
 *                       example: cash
 *                     time:
 *                       type: string
 *                       format: date-time
 *                     jobId:
 *                       type: string
 *                     technicianId:
 *                       type: string
 *       400:
 *         description: Validation error / Invalid amount / Prepaid job / Invalid job status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Invalid amount, can not be paid
 *       404:
 *         description: Job not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Job not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /technician/job/{jobId}/complete/rating:
 *   post:
 *     tags:
 *       - Technician Jobs (👇TECHNICIAN APIs)
 *     summary: Technician rates user after job completion
 *     description:
 *       Technician can rate the user after job completion:
 *       - Job must be assigned to the technician
 *       - Job status must be "fullAndPaid"
 *       - Payment must be completed (collected or prepaid)
 *       - Rating should be between 1 to 5
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
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *               additionalComment:
 *                 type: string
 *                 example: Customer was cooperative and polite
 *     responses:
 *       200:
 *         description: Rating submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Job rated successfully
 *                 info:
 *                   type: object
 *                   properties:
 *                     rating:
 *                       type: number
 *                       example: 4
 *                     additionalComment:
 *                       type: string
 *                       example: Customer was cooperative and polite
 *                     time:
 *                       type: string
 *                       format: date-time
 *                     jobId:
 *                       type: string
 *                     technicianId:
 *                       type: string
 *       400:
 *         description: Validation error / Job not completed / Payment not done / Not assigned to technician
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Job status is not completed, can not be rated
 *       404:
 *         description: Job not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Job not found
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

/**
 * @swagger
 * /technician/job/{jobId}/submit-payment:
 *   post:
 *     tags:
 *       - Technician Jobs (👇TECHNICIAN APIs)
 *     summary: Submit collected payment for admin verification
 *     description:
 *       Technician submits collected payment for admin approval:
 *       - Job must be assigned to the technician
 *       - Job status must be "completed"
 *       - Only applicable for non-prepaid jobs
 *       - Payment goes into pending state until admin confirms
 *       - Technician gets 7 days deadline to settle payment
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
 *               - paymentAmount
 *               - paymentMethod
 *             properties:
 *               paymentAmount:
 *                 type: number
 *                 example: 1200
 *               paymentMethod:
 *                 type: string
 *                 example: cash
 *     responses:
 *       200:
 *         description: Payment submitted successfully for admin confirmation
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
 *                   example: Payment submitted for admin confirmation
 *                 collectionDeadline:
 *                   type: string
 *                   format: date-time
 *                 paymentCollectionStatus:
 *                   type: string
 *                   example: pending
 *       400:
 *         description: Validation error / Invalid job state / Payment not allowed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Job must be completed before submitting payment
 *       404:
 *         description: Job not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Job not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /technician/job/{jobId}/createQuote:
 *   post:
 *     tags:
 *       - Technician Jobs (👇TECHNICIAN APIs)
 *     summary: Create quotation for a job
 *     description:
 *       Technician creates a quotation for a job which requires approval from customer.
 *       - Job must exist
 *       - Items are mandatory
 *       - GST is auto-calculated (18%)
 *       - Quotation validity is 7 days
 *       - Status is set to "pending" until customer approves
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
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - itemType
 *                     - itemName
 *                     - quantity
 *                     - unitPrice
 *                   properties:
 *                     itemType:
 *                       type: string
 *                       enum: [custom_part, replacement_part, service]
 *                       example: replacement_part
 *                     productId:
 *                       type: string
 *                       nullable: true
 *                       example: 65f1a2b3c4d5e6f7g8h9
 *                     itemName:
 *                       type: string
 *                       example: RO Membrane
 *                     brand:
 *                       type: string
 *                       example: Kent
 *                     description:
 *                       type: string
 *                       example: High quality membrane
 *                     quantity:
 *                       type: number
 *                       example: 2
 *                     unitPrice:
 *                       type: number
 *                       example: 1200
 *                     warranty:
 *                       type: object
 *                       properties:
 *                         period:
 *                           type: string
 *                           example: 6 months
 *               additionalCharges:
 *                 type: number
 *                 example: 100
 *               notes:
 *                 type: string
 *                 example: Extra fitting charges may apply
 *               terms:
 *                 type: string
 *                 example: Warranty valid only with bill
 *     responses:
 *       201:
 *         description: Quotation created successfully
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
 *                   example: Quotation created and sent for customer approval
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid input / Items missing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Quotation items are required
 *       404:
 *         description: Job not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Job not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /technician/job/getQuotationSummary/{quotationId}:
 *   get:
 *     tags:
 *       - Technician Jobs (👇TECHNICIAN APIs)
 *     summary: Get quotation summary
 *     description:
 *       Retrieve full quotation details created by the technician.
 *       - Quotation must exist
 *       - Quotation must belong to the logged-in technician
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: quotationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Quotation ID
 *     responses:
 *       200:
 *         description: Quotation summary fetched successfully
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
 *                   example: Quotation summary fetched successfully
 *                 data:
 *                   type: object
 *       400:
 *         description: Quotation not assigned to technician
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Quotation is not assigned to you
 *       404:
 *         description: Quotation not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Quotation not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /user/quotation:
 *   get:
 *     tags:
 *       - Technician Jobs (👇USER APIs)
 *     summary: Get all quotations for user
 *     description:
 *       Retrieve paginated list of quotations for the logged-in user.
 *       - Can filter by status (pending, approved, rejected, expired, awaiting_service)
 *       - Supports pagination
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of records per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: Filter quotations by status
 *     responses:
 *       200:
 *         description: Quotations fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 total:
 *                   type: number
 *                   example: 25
 *                 page:
 *                   type: number
 *                   example: 1
 *                 pages:
 *                   type: number
 *                   example: 3
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Invalid query params
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /user/quotation/{quotationId}/reject:
 *   post:
 *     tags:
 *       - Technician Jobs (👇USER APIs)
 *     summary: Reject quotation
 *     description:
 *       User rejects a quotation provided by technician.
 *       - Quotation must belong to the logged-in user
 *       - Only pending quotations can be rejected
 *       - Reason is mandatory
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: quotationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Quotation ID
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
 *                 example: Too expensive
 *     responses:
 *       200:
 *         description: Quotation rejected successfully
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
 *                   example: Quotation rejected successfully
 *       400:
 *         description: Validation error / Invalid status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Only pending quotations can be rejected
 *       403:
 *         description: Forbidden - Not user's quotation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: You are not allowed to reject this quotation
 *       404:
 *         description: Quotation not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Quotation not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /user/quotation/{quotationId}/approve:
 *   post:
 *     tags:
 *       - Technician Jobs (👇USER APIs)
 *     summary: Approve quotation
 *     description:
 *       User approves a quotation submitted by technician.
 *       - Quotation must belong to the logged-in user
 *       - Only pending quotations can be approved
 *       - Expired quotations cannot be approved
 *       - After approval, job flow continues
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: quotationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Quotation ID
 *     responses:
 *       200:
 *         description: Quotation approved successfully
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
 *                   example: Quotation approved successfully
 *       400:
 *         description: Invalid status / Expired quotation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Only pending quotations can be approved
 *       403:
 *         description: Forbidden - Not user's quotation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: You are not allowed to approve this quotation
 *       404:
 *         description: Quotation not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Quotation not found
 *       401:
 *         description: Unauthorized
 */

// /**
//  * @swagger
//  * /technician/job/{jobId}/reschedule-request:
//  *   post:
//  *     tags:
//  *       - Technician Jobs (👇TECHNICIAN APIs)
//  *     summary: Submit reschedule request
//  *     description: Technician requests to reschedule an assigned job (Phase 3)
//  *     security:
//  *       - cookieAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: jobId
//  *         required: true
//  *         schema:
//  *           type: string
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - reason
//  *               - requestedDate
//  *             properties:
//  *               reason:
//  *                 type: string
//  *                 description: Reason for requesting reschedule
//  *               requestedDate:
//  *                 type: string
//  *                 format: date-time
//  *                 description: New preferred date and time for the job
//  *     responses:
//  *       200:
//  *         description: Reschedule request submitted successfully
//  *       400:
//  *         description: Invalid request or job cannot be rescheduled
//  *       404:
//  *         description: Job not found
//  *       401:
//  *         description: Unauthorized
//  */

// /**
//  * @swagger
//  * /technician/job/{jobId}/start-install:
//  *   post:
//  *     tags:
//  *       - Technician Jobs (👇TECHNICIAN APIs)
//  *     summary: Start install phase for relocation jobs
//  *     description: For relocation jobs after uninstall completion, technician verifies presence at new location and starts install phase (Phase 4)
//  *     security:
//  *       - cookieAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: jobId
//  *         required: true
//  *         schema:
//  *           type: string
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - otp
//  *             properties:
//  *               otp:
//  *                 type: string
//  *                 description: OTP sent for install phase verification
//  *     responses:
//  *       200:
//  *         description: Install phase started successfully
//  *       400:
//  *         description: Invalid OTP or not a relocation job in install phase
//  *       404:
//  *         description: Job not found
//  *       401:
//  *         description: Unauthorized
//  */

const router = express.Router();

// (👇TECHNICIAN APIs)
router.get("/", authenticateTechnician, getJobController);
router.get("/:jobId", authenticateTechnician, getJobByIdController);
router.post("/:jobId/accept", authenticateTechnician, acceptJobController);
router.post("/:jobId/cancel", authenticateTechnician, cancelJobController);
router.post(
  "/:jobId/reschedule",
  authenticateTechnician,
  rescheduleJobController,
);
// router.post("/:jobId/reschedule-request", authenticateTechnician, submitRescheduleRequestController);
router.post("/:jobId/reached", authenticateTechnician, reachedJobController);
router.post("/:jobId/start", authenticateTechnician, startJobController);
router.post(
  "/:jobId/:serviceId/start",
  authenticateTechnician,
  startJobServicesController,
);
router.post(
  "/:jobId/:serviceId/complete",
  authenticateTechnician,
  completeJobServiceController,
);
// router.post("/:jobId/start-install", authenticateTechnician, startInstallPhaseController);
router.post("/:jobId/complete", authenticateTechnician, completeJobController);
router.post(
  "/:jobId/complete/payment/cash",
  authenticateTechnician,
  completePaymentCashController,
);
router.post(
  "/:jobId/complete/rating",
  authenticateTechnician,
  ratingByTechnicianController,
);
router.post(
  "/:jobId/rate-technician",
  authenticateUser,
  ratingByUserToTechnician,
);

router.post(
  "/:jobId/submit-payment",
  authenticateTechnician,
  submitPaymentCollectionController,
);

router.post("/createQuote", authenticateTechnician, createQuoteController);
router.get(
  "/getQuotationSummary/:quotationId",
  authenticateTechnician,
  getQuotationSummaryController,
);

// (👇USER APIs)
router.get("/quotation", authenticateUser, getQuotationController);
router.post(
  "/quotation/:quotationId/reject",
  authenticateUser,
  rejectQuotationController,
);
router.post(
  "/quotation/:quotationId/approve",
  authenticateUser,
  approveQuotationController,
);

export default router;
