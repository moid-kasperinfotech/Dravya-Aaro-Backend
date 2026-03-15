import express from "express";
import { authenticateUser } from "../../middlewares/authorisation.js";
import {
  bookServiceController,
  getHistoryJobController,
  getOngoingJobController,
  acceptRescheduleController,
  rejectRescheduleController,
  addJobToCartController,
  getCartDetailsController,
  clearCartController,
} from "../../controllers/Users/booking.js";
import upload from "../../middlewares/multer.js";

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
 *     description: Book a technician service with location and service details
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
 *                 description: Array of service IDs to book
 *                 example:
 *                   - SERV-1733707200000
 *                   - SERV-1733707200001
 *               brandName:
 *                 type: string
 *                 example: LG
 *               modelType:
 *                 type: string
 *                 example: AC500Z
 *               problems:
 *                 type: string
 *                 example: Not cooling properly, making noise
 *               remarkByUser:
 *                 type: string
 *                 example: Please arrive after 2 PM
 *               preferredStartTime:
 *                 type: string
 *                 format: date-time
 *                 example: 2024-03-10T10:00:00Z
 *               preferredDuration:
 *                 type: string
 *                 example: 2 hours
 *               house_apartment:
 *                 type: string
 *                 example: Apartment 301
 *               street_sector:
 *                 type: string
 *                 example: Sector 5, Palm Springs
 *               landmark:
 *                 type: string
 *                 example: Near Central Park
 *               fullName:
 *                 type: string
 *                 example: Rajesh Kumar
 *     responses:
 *       201:
 *         description: Service booked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
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
 *     description: Retrieve list of currently ongoing service jobs for the user
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Ongoing jobs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Job'
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
 *     description: Retrieve history of completed and past jobs
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
 *         description: Job history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Job'
 *                 count:
 *                   type: number
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /user/booking/{jobId}/accept-reschedule:
 *   post:
 *     tags:
 *       - User Bookings
 *     summary: Accept reschedule request
 *     description: User accepts technician's rescheduling request for a job
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reschedule request accepted successfully
 *       400:
 *         description: No pending reschedule request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Job not found
 */

/**
 * @swagger
 * /user/booking/{jobId}/reject-reschedule:
 *   post:
 *     tags:
 *       - User Bookings
 *     summary: Reject reschedule request
 *     description: User rejects technician's rescheduling request for a job
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reschedule request rejected successfully
 *       400:
 *         description: No pending reschedule request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Job not found
 */

const router = express.Router();

router.post("/add-to-cart", authenticateUser, addJobToCartController);
router.get("/cart", authenticateUser, getCartDetailsController);
router.delete("/clear-cart", authenticateUser, clearCartController);

router.post(
  "/",
  upload.array("imageByUser", 5),
  authenticateUser,
  bookServiceController,
);
router.get("/job", authenticateUser, getOngoingJobController);
router.get("/job/history", authenticateUser, getHistoryJobController);
router.post(
  "/:jobId/accept-reschedule",
  authenticateUser,
  acceptRescheduleController,
);
router.post(
  "/:jobId/reject-reschedule",
  authenticateUser,
  rejectRescheduleController,
);

export default router;
