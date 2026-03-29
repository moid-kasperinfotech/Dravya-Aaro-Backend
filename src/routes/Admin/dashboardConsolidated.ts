import express from "express";
import { authenticateAdmin } from "../../middlewares/authorization.js";
import {
  getAnalytics,
  getJobsList,
  getAvailableTechnicians,
  getQuotationDetails,
} from "../../controllers/Admin/dashboardControllerConsolidated.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Admin Dashboard (Consolidated)
 *     description: Unified analytics and list endpoints
 */

/**
 * @swagger
 * /admin/dashboard/analytics:
 *   get:
 *     tags:
 *       - Admin Dashboard (Consolidated)
 *     summary: Get analytics (today-stats, job-stats, revenue-trend consolidated)
 *     description: Unified analytics endpoint supporting type=today|stats|revenue
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         description: Analytics type (today=daily stats, stats=summary statistics, revenue=financial data)
 *         schema:
 *           type: string
 *           enum: [today, stats, revenue]
 *           default: today
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
 *         name: groupBy
 *         description: Group data by time period (day=daily, week=weekly, month=monthly, year=yearly)
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *           default: day
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
 *       400:
 *         description: Invalid parameters
 */
router.get("/analytics", authenticateAdmin, getAnalytics);

/**
 * @swagger
 * /admin/dashboard/jobs-list:
 *   get:
 *     tags:
 *       - Admin Dashboard (Consolidated)
 *     summary: Get jobs list (live-jobs and reschedule-requests consolidated)
 *     description: Unified list endpoint supporting listType=live|requests
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: listType
 *         description: List type (live=ongoing jobs, requests=pending reschedule/reassign/cancellation requests)
 *         schema:
 *           type: string
 *           enum: [live, requests]
 *           default: live
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, pending, assigned, reached, in_progress, completed, cancelled, rescheduled, fullAndPaid]
 *       - in: query
 *         name: requestType
 *         description: Filter request initiator (all=any, customer=user initiated, technician=tech initiated)
 *         schema:
 *           type: string
 *           enum: [all, customer, technician]
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
 *         description: Jobs list retrieved successfully
 */
router.get("/jobs-list", authenticateAdmin, getJobsList);

/**
 * @swagger
 * /admin/dashboard/available-technicians:
 *   get:
 *     tags:
 *       - Admin Dashboard (Consolidated)
 *     summary: Get available technicians
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
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *     responses:
 *       200:
 *         description: Available technicians retrieved successfully
 */
router.get("/available-technicians", authenticateAdmin, getAvailableTechnicians);

/**
 * @swagger
 * /admin/dashboard/quotation/{jobId}:
 *   get:
 *     tags:
 *       - Admin Dashboard (Consolidated)
 *     summary: Get quotation details for a job
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quotation details retrieved successfully
 *       404:
 *         description: Job not found
 */
router.get("/quotation/:jobId", authenticateAdmin, getQuotationDetails);

export default router;
