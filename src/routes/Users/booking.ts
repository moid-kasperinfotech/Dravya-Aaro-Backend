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

const router = express.Router();

router.post("/", authenticateUser, bookServiceController);
router.get("/job", authenticateUser, getOngoingJobController);
router.get("/job/history", authenticateUser, getHistoryJobController);

export default router;