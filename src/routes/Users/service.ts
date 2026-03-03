import { getAllServicesUserController, getReviewsByServiceIdUserController, getServiceByIdUserController } from "../../controllers/Users/service.js";
import { authenticateUser } from "../../middlewares/authorisation.js";
import express from "express";

/**
 * @swagger
 * tags:
 *   - name: User Services
 *     description: User service browsing endpoints
 */

/**
 * @swagger
 * /user/service:
 *   get:
 *     tags:
 *       - User Services
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
 *       - User Services
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
 *       - User Services
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

const router = express.Router();

router.get("/", authenticateUser, getAllServicesUserController);

router.get("/:serviceId", authenticateUser, getServiceByIdUserController);

router.get("/:serviceId/reviews", authenticateUser, getReviewsByServiceIdUserController);

export default router;