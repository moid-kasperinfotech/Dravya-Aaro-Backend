import { deleteServiceByIdController, getAllServicesController, getServiceByIdController, getServiceCountController, servicePostController } from "../../controllers/Admin/service.js";
import { authenticateAdmin } from "../../middlewares/authorisation.js";
import upload from "../../middlewares/multer.js";
import express from "express";

/**
 * @swagger
 * tags:
 *   - name: Admin Services
 *     description: Admin service management endpoints
 */

/**
 * @swagger
 * /admin/service:
 *   patch:
 *     tags:
 *       - Admin Services
 *     summary: Create or update service
 *     description: Create a new service or update existing service with image upload
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - category
 *               - name
 *               - price
 *               - duration
 *               - process
 *               - includes
 *               - frequentlyAskedQuestions
 *             properties:
 *               type:
 *                 type: string
 *               category:
 *                 type: string
 *               name:
 *                 type: string
 *                 example: Plumbing Service
 *               price:
 *                 type: number
 *                 example: 500
 *               duration:
 *                 type: string
 *                 description: JSON stringified duration object
 *               process:
 *                 type: string
 *                 description: JSON stringified process object
 *               includes:
 *                 type: string
 *                 description: JSON stringified includes array
 *               frequentlyAskedQuestions:
 *                 type: string
 *                 description: JSON stringified FAQ array
 *               status:
 *                 type: string
 *               markAsPopular:
 *                 type: boolean
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Service created/updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *   get:
 *     tags:
 *       - Admin Services
 *     summary: Get all services
 *     description: Retrieve all services with optional filtering
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               category:
 *                 type: string
 *               status:
 *                 type: string
 *               populararity:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Services retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 services:
 *                   type: array
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /admin/service/count:
 *   get:
 *     tags:
 *       - Admin Services
 *     summary: Get service count
 *     description: Get total count of services including active and inactive counts
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Service count retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 count:
 *                   type: integer
 *                 activeCount:
 *                   type: integer
 *                 inactiveCount:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /admin/service/{serviceId}:
 *   get:
 *     tags:
 *       - Admin Services
 *     summary: Get service by ID
 *     description: Retrieve service details by service ID
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Service ID
 *     responses:
 *       200:
 *         description: Service retrieved successfully
 *       404:
 *         description: Service not found
 *       401:
 *         description: Unauthorized
 *   delete:
 *     tags:
 *       - Admin Services
 *     summary: Delete service
 *     description: Delete a service by ID
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
 *         description: Service deleted successfully
 *       404:
 *         description: Service not found
 *       401:
 *         description: Unauthorized
 */

const router = express.Router();

router.patch("/", authenticateAdmin, upload.single("image"), servicePostController);

router.get("/count", authenticateAdmin, getServiceCountController);

router.get("/", authenticateAdmin, getAllServicesController); // filter required

router.get("/:serviceId", authenticateAdmin, getServiceByIdController);

router.delete("/:serviceId", authenticateAdmin, deleteServiceByIdController);

export default router;