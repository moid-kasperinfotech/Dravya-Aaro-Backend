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
 *               - serviceName
 *             properties:
 *               serviceName:
 *                 type: string
 *                 example: Plumbing Service
 *               duration:
 *                 type: number
 *                 example: 60
 *               price:
 *                 type: number
 *                 example: 500
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
 *         description: Services retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 services:
 *                   type: array
 *       401:
 *         description: Unauthorized

/**
 * @swagger
 * /admin/service/count:
 *   get:
 *     tags:
 *       - Admin Services
 *     summary: Get service count
 *     description: Get total count of services
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
 *                 success:
 *                   type: boolean
 *                 count:
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