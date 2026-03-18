import express from "express";
import { authenticateUser } from "../../middlewares/authorisation.js";
import {
  bookServiceController,
  getHistoryJobController,
  getOngoingJobController,
  acceptRescheduleController,
  rejectRescheduleController,
  addJobToCartController,
  getJobCartController,
} from "../../controllers/Users/booking.js";
import upload from "../../middlewares/multer.js";

/**
 * @swagger
 * tags:
 *   - name: User Bookings (👇USER APIs)
 *     description: User service booking endpoints
 */

/**
 * @swagger
 * /user/booking/add-job/cart:
 *   post:
 *     tags:
 *       - User Bookings
 *     summary: Add service to cart
 *     description: Add a service to the user's job cart
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
 *             properties:
 *               serviceId:
 *                 type: string
 *                 example: SERV-1733707200000
 *               serviceQuantity:
 *                 type: number
 *                 default: 1
 *                 example: 2
 *     responses:
 *       200:
 *         description: Service added to cart successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 jobCart:
 *                   type: object
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Service not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /user/booking/job-cart:
 *   get:
 *     tags:
 *       - User Bookings
 *     summary: Get job cart
 *     description: Retrieve the user's current job cart with all services
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Job cart fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 jobCart:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                     serviceList:
 *                       type: array
 *                       items:
 *                         type: object
 *                     totalQuantity:
 *                       type: number
 *                     servicePriceTotal:
 *                       type: number
 *                     gstTax:
 *                       type: number
 *                     payableAmount:
 *                       type: number
 *       404:
 *         description: Job cart not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /user/booking:
 *   post:
 *     tags:
 *       - User Bookings
 *     summary: Book a service
 *     description: Book services from cart with location and service details
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - brandName
 *               - modelType
 *               - date
 *               - timeRange
 *               - paymentMethod
 *               - problems
 *               - imageByUser
 *             properties:
 *               brandName:
 *                 type: string
 *                 example: LG
 *               modelType:
 *                 type: string
 *                 example: AC500Z
 *               problems:
 *                 type: string
 *                 description: JSON array of problems
 *                 example: '["Not cooling properly", "Making noise"]'
 *               remarkByUser:
 *                 type: string
 *                 example: Please arrive after 2 PM
 *               date:
 *                 type: string
 *                 format: date
 *                 example: 2024-03-10
 *               timeRange:
 *                 type: string
 *                 example: 10:00-12:00
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, online]
 *                 example: cash
 *               addressType:
 *                 type: string
 *                 enum: [fromAddress, toAddress]
 *                 example: fromAddress
 *               serviceAddress:
 *                 type: string
 *                 description: JSON object for service address
 *                 example: '{"house_apartment":"Apartment 301","street_sector":"Sector 5","landmark":"Near Park"}'
 *               fromAddress:
 *                 type: string
 *                 description: JSON object for from address (relocation)
 *                 example: '{"house_apartment":"Apartment 301","street_sector":"Sector 5","landmark":"Near Park"}'
 *               toAddress:
 *                 type: string
 *                 description: JSON object for to address (relocation)
 *                 example: '{"house_apartment":"Apartment 401","street_sector":"Sector 6","landmark":"Near Mall"}'
 *               imageByUser:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Upload up to 5 images
 *     responses:
 *       201:
 *         description: Job created successfully
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

router.post("/add-job/cart", authenticateUser, addJobToCartController);
router.get("/job-cart", authenticateUser, getJobCartController);
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
