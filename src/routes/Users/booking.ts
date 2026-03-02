import express from "express";
import { authenticateUser } from "../../middlewares/authorisation.js";
import { bookServiceController, getHistoryJobController, getOngoingJobController } from "../../controllers/Users/booking.js";

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
 *               - serviceId
 *               - scheduledDate
 *             properties:
 *               serviceId:
 *                 type: string
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *               serviceAddress:
 *                 type: string
 *     responses:
 *       200:
 *         description: Service booked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 job:
 *                   type: object
 *       400:
 *         description: Invalid booking request
 *       401:
 *         description: Unauthorized
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 jobs:
 *                   type: array
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
 *         name: skip
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Job history retrieved
 *       401:
 *         description: Unauthorized
 */

const router = express.Router();

router.post("/", authenticateUser, bookServiceController);
router.get("/job", authenticateUser, getOngoingJobController);
router.get("/job/history", authenticateUser, getHistoryJobController);

export default router;