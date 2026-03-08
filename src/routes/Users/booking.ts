import express from "express";
import { authenticateUser } from "../../middlewares/authorisation.js";
import { bookServiceController, getHistoryJobController, getOngoingJobController, acceptRescheduleController, rejectRescheduleController } from "../../controllers/Users/booking.js";

/**
 * @swagger
 * tags:
 *   - name: User Bookings
 *     description: User service booking endpoints
 */

/**
 * @swagger
 * /user/booking:
 *   post:
 *     tags:
 *       - User Bookings
 *     summary: Book a service
 *     description: Book a technician service
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - services
 *               - preferredStartTime
 *             properties:
 *               services:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of service IDs
 *               brandName:
 *                 type: string
 *               modelType:
 *                 type: string
 *               problems:
 *                 type: string
 *               remarkByUser:
 *                 type: string
 *               preferredStartTime:
 *                 type: string
 *                 format: date-time
 *               preferredDuration:
 *                 type: string
 *               house_apartment:
 *                 type: string
 *               street_sector:
 *                 type: string
 *               landmark:
 *                 type: string
 *               fullName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Service booked successfully
 *       400:
 *         description: Invalid booking request
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /user/booking/job:
 *   get:
 *     tags:
 *       - User Bookings
 *     summary: Get ongoing jobs
 *     description: Retrieve list of ongoing service jobs
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Ongoing jobs retrieved
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /user/booking/job/history:
 *   get:
 *     tags:
 *       - User Bookings
 *     summary: Get job history
 *     description: Retrieve history of completed jobs
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
 *           default: 20
 *     responses:
 *       200:
 *         description: Job history retrieved
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /user/booking/{jobId}/accept-reschedule:
 *   post:
 *     tags:
 *       - User Bookings (new)
 *     summary: Accept reschedule request
 *     description: User accepts technician's reschedule request (Phase 3)
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
 *         description: Reschedule request accepted successfully
 *       400:
 *         description: No pending reschedule request
 *       403:
 *         description: Not authorized to accept this reschedule
 *       404:
 *         description: Job not found
 */

/**
 * @swagger
 * /user/booking/{jobId}/reject-reschedule:
 *   post:
 *     tags:
 *       - User Bookings (new)
 *     summary: Reject reschedule request
 *     description: User rejects technician's reschedule request (Phase 3)
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
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for rejection
 *     responses:
 *       200:
 *         description: Reschedule request rejected successfully
 *       400:
 *         description: No pending reschedule request
 *       403:
 *         description: Not authorized to reject this reschedule
 *       404:
 *         description: Job not found
 */

const router = express.Router();

router.post("/", authenticateUser, bookServiceController);
router.get("/job", authenticateUser, getOngoingJobController);
router.get("/job/history", authenticateUser, getHistoryJobController);
router.post("/:jobId/accept-reschedule", authenticateUser, acceptRescheduleController);
router.post("/:jobId/reject-reschedule", authenticateUser, rejectRescheduleController);

export default router;