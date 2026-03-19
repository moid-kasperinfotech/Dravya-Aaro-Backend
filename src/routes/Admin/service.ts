import {
  deleteServiceByIdController,
  getAllServicesController,
  getServiceByIdController,
  getServiceCountController,
  servicePostController,
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
 *     summary: Create or update service
 *     description: Create a new service or update existing service with optional image upload. Use multipart/form-data for file upload.
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
 *                 enum: [installation-uninstallation, repair]
 *                 example: installation-uninstallation
 *                 description: Service type (installation-uninstallation or repair)
 *               category:
 *                 type: string
 *                 enum: [home, industry]
 *                 example: home
 *                 description: Service category (home or industry)
 *               name:
 *                 type: string
 *                 example: AC Installation Service
 *               price:
 *                 type: number
 *                 example: 2500
 *                 description: Price in rupees
 *               duration:
 *                 type: string
 *                 example: '{"count":120,"type":"minute"}'
 *                 description: JSON string with count (number) and type enum [minute]
 *               process:
 *                 type: string
 *                 example: '[{"title":"Assessment","description":"Check system"},{"title":"Installation","description":"Install unit"}]'
 *                 description: JSON string array of process steps with title and description
 *               includes:
 *                 type: string
 *                 example: '[{"title":"Installation kit","description":"Everything needed"},{"title":"Pipe fittings","description":"Standard fittings"}]'
 *                 description: JSON string array of included items with title and description
 *               frequentlyAskedQuestions:
 *                 type: string
 *                 example: '[{"question":"How long does installation take?","answer":"Approximately 2-3 hours"},{"question":"Is there a warranty?","answer":"Yes, 1 year warranty included"}]'
 *                 description: JSON string array of FAQs with question and answer
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 example: active
 *                 description: Service availability status (active or inactive)
 *               markAsPopular:
 *                 type: boolean
 *                 example: true
 *                 description: Mark service as popular (will appear in top services list)
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Service image file (jpg, png)
 *     responses:
 *       200:
 *         description: Service created or updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 service:
 *                   type: object
 *       400:
 *         description: Validation error - missing required fields
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

router.get("/:serviceId", authenticateAdmin, getServiceByIdController);

router.delete("/:serviceId", authenticateAdmin, deleteServiceByIdController);

export default router;
