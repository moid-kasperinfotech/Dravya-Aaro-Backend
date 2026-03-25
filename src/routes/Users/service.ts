import { getAllServicesUserController, getReviewsByServiceIdUserController, getServiceByIdUserController, rateServiceByUserController } from "../../controllers/Users/service.js";
import { authenticateUser } from "../../middlewares/authorisation.js";
import express from "express";

/**
 * @swagger
 * tags:
 *   - name: User Services (👇USER APIs)
 *     description: User service browsing endpoints
 */

/**
 * @swagger
 * /user/service:
 *   get:
 *     tags:
 *       - User Services (👇USER APIs)
 *     summary: Get all services
 *     description: Browse available services
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
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [installation, uninstallation, installation-uninstallation, repair]
 *         description: Filter by service type
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Services retrieved successfully
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /user/service/{serviceId}:
 *   get:
 *     tags:
 *       - User Services (👇USER APIs)
 *     summary: Get service details
 *     description: Retrieve detailed information about a specific service
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Service details retrieved
 *       404:
 *         description: Service not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /user/service/{serviceId}/reviews:
 *   get:
 *     tags:
 *       - User Services (👇USER APIs)
 *     summary: Get service reviews
 *     description: Retrieve reviews and ratings for a specific service
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: reviewPage
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: reviewLimit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 *       404:
 *         description: Service not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /user/service/{jobId}/{serviceId}/rate:
 *   post:
 *     tags:
 *       - User Services (👇USER APIs)
 *     summary: Rate a completed service
 *     description: User can rate and review a completed service from a job. Each service can be rated only once.
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
 *         description: Service ID
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
 *                 example: Excellent service, very professional
 *     responses:
 *       201:
 *         description: Service rated successfully
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
 *                   example: Service rated successfully
 *                 review:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     serviceId:
 *                       type: string
 *                     userId:
 *                       type: string
 *                     jobId:
 *                       type: string
 *                     technicianId:
 *                       type: string
 *                     rating:
 *                       type: number
 *                     comment:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error / Service not completed / Already rated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: User not allowed to rate this job
 *       404:
 *         description: Job or Service not found
 */

const router = express.Router();

router.get("/", authenticateUser, getAllServicesUserController);

router.get("/:serviceId", authenticateUser, getServiceByIdUserController);

router.post("/:jobId/:serviceId/rate", authenticateUser, rateServiceByUserController)

router.get("/:serviceId/reviews", authenticateUser, getReviewsByServiceIdUserController);

export default router;