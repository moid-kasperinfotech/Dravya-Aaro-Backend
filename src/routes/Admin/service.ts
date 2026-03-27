import {
  deleteServiceByIdController,
  getAllServicesController,
  getServiceByIdController,
  getServiceCountController,
  servicePostController,
  toggleServiceStatusController,
} from "../../controllers/Admin/service.js";
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
 *     summary: Create new service
 *     description: Create a new service with optional image upload. Use multipart/form-data.
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
 *               - taxRate
 *             properties:
 *               type:
 *                 type: string
 *                 enum:
 *                   - installation
 *                   - uninstallation
 *                   - installation-uninstallation
 *                   - repair
 *                 example: repair
 *               category:
 *                 type: string
 *                 enum: [home, industry]
 *                 example: home
 *               name:
 *                 type: string
 *                 example: AC Repair Service
 *               price:
 *                 type: number
 *                 example: 1500
 *               duration:
 *                 type: string
 *                 example: '{"count":60,"type":"minute"}'
 *               process:
 *                 type: string
 *                 example: '[{"title":"Inspection","description":"Check issue"},{"title":"Repair","description":"Fix issue"}]'
 *               includes:
 *                 type: string
 *                 example: '[{"title":"Service charge","description":"Included"}]'
 *               frequentlyAskedQuestions:
 *                 type: string
 *                 example: '[{"question":"Time required?","answer":"1 hour"}]'
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 example: active
 *               markAsPopular:
 *                 type: boolean
 *                 example: true
 *               taxRate:
 *                 type: number
 *                 example: 18
 *               requiredQuotation:
 *                 type: boolean
 *                 example: false
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Service created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /admin/service/{serviceId}:
 *   patch:
 *     tags:
 *       - Admin Services
 *     summary: Update existing service
 *     description: Update an existing service using serviceId. Image upload optional.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
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
 *               - taxRate
 *             properties:
 *               type:
 *                 type: string
 *                 enum:
 *                   - installation
 *                   - uninstallation
 *                   - installation-uninstallation
 *                   - repair
 *                 example: installation-uninstallation
 *               category:
 *                 type: string
 *                 enum: [home, industry]
 *                 example: home
 *               name:
 *                 type: string
 *                 example: AC Installation Service
 *               price:
 *                 type: number
 *                 example: 2500
 *               duration:
 *                 type: string
 *                 example: '{"count":120,"type":"minute"}'
 *               process:
 *                 type: string
 *                 example: '[{"title":"Setup","description":"Install AC"}]'
 *               includes:
 *                 type: string
 *                 example: '[{"title":"Installation kit","description":"Included"}]'
 *               frequentlyAskedQuestions:
 *                 type: string
 *                 example: '[{"question":"Warranty?","answer":"1 year"}]'
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 example: active
 *               markAsPopular:
 *                 type: boolean
 *                 example: false
 *               taxRate:
 *                 type: number
 *                 example: 18
 *               requiredQuotation:
 *                 type: boolean
 *                 example: true
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Service updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Service not found
 */

/**
 * @swagger
 * /admin/service/count:
 *   get:
 *     tags:
 *       - Admin Services
 *     summary: Get service count statistics
 *     description: Retrieve total count of services including active and inactive counts
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Service count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Service count fetched successfully
 *                 count:
 *                   type: number
 *                   example: 25
 *                 activeCount:
 *                   type: number
 *                   example: 20
 *                 inactiveCount:
 *                   type: number
 *                   example: 5
 *             example:
 *               message: Service count fetched successfully
 *               count: 25
 *               activeCount: 20
 *               inactiveCount: 5
 *       401:
 *         description: Unauthorized - admin authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedError'
 */

/**
 * @swagger
 * /admin/service:
 *   get:
 *     tags:
 *       - Admin Services
 *     summary: Get all services with filters
 *     description: Retrieve all services with optional filters for category, status, popularity, and type
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
 *                 enum: [home, industry]
 *                 example: home
 *                 description: Filter by service category
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 example: active
 *                 description: Filter by service status
 *               populararity:
 *                 type: boolean
 *                 example: true
 *                 description: Filter by popular services
 *               type:
 *                 type: string
 *                 enum: [installation, uninstallation, installation-uninstallation, repair]
 *                 example: installation
 *                 description: Filter by service type
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
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /admin/service/{serviceId}/toggle-status:
 *   patch:
 *     tags:
 *       - Admin Services
 *     summary: Toggle service status (active/inactive)
 *     description: Switch a service status between active and inactive
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB Service ID
 *     responses:
 *       200:
 *         description: Service status updated successfully
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
 *                   example: Service status updated successfully
 *                 service:
 *                   type: object
 *       404:
 *         description: Service not found
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
 *     description: Retrieve detailed information about a specific service
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
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Service not found
 *   delete:
 *     tags:
 *       - Admin Services
 *     summary: Delete service
 *     description: Delete a service by its service ID
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Service ID to delete
 *     responses:
 *       200:
 *         description: Service deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Service not found
 */

const router = express.Router();

router.patch(
  "/",
  authenticateAdmin,
  upload.single("image"),
  servicePostController,
);
router.patch(
  "/:serviceId",
  authenticateAdmin,
  upload.single("image"),
  servicePostController,
);

router.get("/count", authenticateAdmin, getServiceCountController);

router.get("/", authenticateAdmin, getAllServicesController); // filter required

router.patch(
  "/:serviceId/toggle-status",
  authenticateAdmin,
  toggleServiceStatusController,
);

router.get("/:serviceId", authenticateAdmin, getServiceByIdController);

router.delete("/:serviceId", authenticateAdmin, deleteServiceByIdController);

export default router;
