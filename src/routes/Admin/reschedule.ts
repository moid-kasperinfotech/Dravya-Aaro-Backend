import express from "express";
import { authenticateAdmin } from "../../middlewares/authorisation.js";
import {
  getRescheduleRequests,
  getRescheduleRequestDetails,
  approveRescheduleRequest,
  rejectRescheduleRequest,
  approveReassignRequest,
  approveCancellationRequest,
  rejectCancellationRequest,
} from "../../controllers/Admin/rescheduleController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Admin Reschedule & Reassign (new)
 *     description: Manage reschedule, reassignment, and cancellation requests
 */

/**
 * @swagger
 * /admin/reschedule-requests:
 *   get:
 *     tags:
 *       - Admin Reschedule & Reassign (new)
 *     summary: Get reschedule/reassign/cancellation requests
 *     description: List all pending requests with filtering by date, request type, and status
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering (YYYY-MM-DD)
 *       - in: query
 *         name: requestType
 *         schema:
 *           type: string
 *           enum: [all, customer, technician]
 *           default: all
 *         description: Filter by who initiated the request
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, pending, reschedule, reassign, cancelled]
 *           default: all
 *         description: Filter by request status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
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
 *         description: List of reschedule/reassign requests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /admin/reschedule-requests/{requestId}:
 *   get:
 *     tags:
 *       - Admin Reschedule & Reassign (new)
 *     summary: Get request details
 *     description: Get full details of a specific reschedule/reassign/cancellation request including available technicians for reassignment
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *         description: Request MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Request details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     job:
 *                       type: object
 *                     customer:
 *                       type: object
 *                     originalTechnician:
 *                       type: object
 *                     serviceDetails:
 *                       type: array
 *                     rescheduleRequest:
 *                       type: object
 *                     reassignRequest:
 *                       type: object
 *                     cancellationRequest:
 *                       type: object
 *                     availableTechnicians:
 *                       type: array
 *                     jobTimeline:
 *                       type: array
 *       400:
 *         description: Invalid requestId format
 *       404:
 *         description: Request not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /admin/reschedule-requests/{requestId}/approve:
 *   post:
 *     tags:
 *       - Admin Reschedule & Reassign (new)
 *     summary: Approve reschedule request
 *     description: Approve a pending reschedule request and update job date/time
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
 *         description: Reschedule approved successfully
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
 *         description: No pending reschedule request for this job
 *       404:
 *         description: Job not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /admin/reschedule-requests/{requestId}/reject:
 *   post:
 *     tags:
 *       - Admin Reschedule & Reassign (new)
 *     summary: Reject reschedule request
 *     description: Reject a pending reschedule request with reason
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 default: Rejected by admin
 *     responses:
 *       200:
 *         description: Reschedule request rejected successfully
 *       400:
 *         description: No pending reschedule request for this job
 *       404:
 *         description: Job not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /admin/reschedule-requests/{requestId}/approve-reassign:
 *   post:
 *     tags:
 *       - Admin Reschedule & Reassign (new)
 *     summary: Approve reassignment request
 *     description: Approve a reassignment and assign job to selected technician
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
 *               - technicianId
 *             properties:
 *               technicianId:
 *                 type: string
 *                 description: MongoDB ObjectId of technician to reassign to
 *     responses:
 *       200:
 *         description: Job reassigned successfully
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
 *         description: Invalid technician or no pending reassignment request
 *       404:
 *         description: Job or Technician not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /admin/reschedule-requests/{requestId}/approve-cancellation:
 *   post:
 *     tags:
 *       - Admin Reschedule & Reassign (new)
 *     summary: Approve job cancellation
 *     description: Approve a cancellation request with optional refund processing
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refundType:
 *                 type: string
 *                 enum: [full, partial, none]
 *                 default: full
 *                 description: Type of refund to process
 *     responses:
 *       200:
 *         description: Cancellation approved
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
 *                   properties:
 *                     jobId:
 *                       type: string
 *                     status:
 *                       type: string
 *                     refundType:
 *                       type: string
 *                     refundAmount:
 *                       type: number
 *       400:
 *         description: Invalid refund type or no pending cancellation request
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /admin/reschedule-requests/{requestId}/reject-cancellation:
 *   post:
 *     tags:
 *       - Admin Reschedule & Reassign (new)
 *     summary: Reject job cancellation
 *     description: Reject a pending cancellation request with reason
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 default: Rejected by admin
 *     responses:
 *       200:
 *         description: Cancellation request rejected
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
 *       500:
 *         description: Server error
 */

// Routes
router.get("/", authenticateAdmin, getRescheduleRequests);
router.get("/:requestId", authenticateAdmin, getRescheduleRequestDetails);
router.post("/:requestId/approve", authenticateAdmin, approveRescheduleRequest);
router.post("/:requestId/reject", authenticateAdmin, rejectRescheduleRequest);
router.post("/:requestId/approve-reassign", authenticateAdmin, approveReassignRequest);
router.post("/:requestId/approve-cancellation", authenticateAdmin, approveCancellationRequest);
router.post("/:requestId/reject-cancellation", authenticateAdmin, rejectCancellationRequest);

export default router;
