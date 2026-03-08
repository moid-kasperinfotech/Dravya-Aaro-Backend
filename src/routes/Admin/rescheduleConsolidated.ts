import express from "express";
import { authenticateAdmin } from "../../middlewares/authorisation.js";
import {
  getRequests,
  getRequestDetails,
  processRequest,
} from "../../controllers/Admin/rescheduleControllerConsolidated.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Admin Reschedule Requests (Consolidated)
 *     description: Unified reschedule, reassign, and cancellation request management
 */

/**
 * @swagger
 * /admin/reschedule-requests:
 *   get:
 *     tags:
 *       - Admin Reschedule Requests (Consolidated)
 *     summary: Get all reschedule/reassign/cancellation requests
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: requestType
 *         schema:
 *           type: string
 *           enum: [all, customer, technician]
 *           default: all
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, pending, approved, rejected]
 *           default: pending
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *     responses:
 *       200:
 *         description: Requests list retrieved successfully
 */
router.get("/", authenticateAdmin, getRequests);

/**
 * @swagger
 * /admin/reschedule-requests/{requestId}:
 *   get:
 *     tags:
 *       - Admin Reschedule Requests (Consolidated)
 *     summary: Get specific request details with available technicians
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Request details retrieved successfully
 *       404:
 *         description: Request not found
 */
router.get("/:requestId", authenticateAdmin, getRequestDetails);

/**
 * @swagger
 * /admin/reschedule-requests/{requestId}/process:
 *   post:
 *     tags:
 *       - Admin Reschedule Requests (Consolidated)
 *     summary: Process request (approve/reject all request types consolidated)
 *     description: Unified endpoint for reschedule/reassign/cancellation approval/rejection
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *               - requestType
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *               requestType:
 *                 type: string
 *                 enum: [reschedule, reassign, cancellation]
 *               technicianId:
 *                 type: string
 *                 description: Required for reassign action
 *               refundType:
 *                 type: string
 *                 enum: [full, partial, none]
 *                 description: For cancellation approval
 *               reason:
 *                 type: string
 *                 description: Reason for rejection or notes
 *     responses:
 *       200:
 *         description: Request processed successfully
 *       400:
 *         description: Invalid parameters or missing required fields
 *       404:
 *         description: Request or technician not found
 */
router.post("/:requestId/process", authenticateAdmin, processRequest);

export default router;
