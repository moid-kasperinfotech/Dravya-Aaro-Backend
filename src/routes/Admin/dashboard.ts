import express from "express";
import { authenticateAdmin } from "../../middlewares/authorization.js";
import {
  getTodayStats,
  getRevenueTrend,
  getJobStats,
  getLiveJobQueue,
  getAvailableTechnicians,
  getQuotationDetails,
  getRefundRequests,
} from "../../controllers/Admin/dashboardController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Admin Dashboard (new)
 *     description: Admin dashboard analytics and reporting endpoints
 */

/**
 * @swagger
 * /admin/dashboard/today-stats:
 *   get:
 *     tags:
 *       - Admin Dashboard (new)
 *     summary: Get today's statistics
 *     description: Get today's job counts by status and count of active technicians
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Today's statistics retrieved successfully
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
 *                     totalJobsToday:
 *                       type: number
 *                       description: Total jobs created today
 *                     activeJobs:
 *                       type: object
 *                       properties:
 *                         pending:
 *                           type: number
 *                         assigned:
 *                           type: number
 *                         reached:
 *                           type: number
 *                         in_progress:
 *                           type: number
 *                         completed:
 *                           type: number
 *                         cancelled:
 *                           type: number
 *                         rescheduled:
 *                           type: number
 *                     activeTechnicians:
 *                       type: number
 *                       description: Count of technicians currently online
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /admin/dashboard/job-stats:
 *   get:
 *     tags:
 *       - Admin Dashboard (new)
 *     summary: Get job statistics
 *     description: Get all-time counts of jobs grouped by status
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Job statistics retrieved successfully
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
 *                     pending:
 *                       type: number
 *                     assigned:
 *                       type: number
 *                     reached:
 *                       type: number
 *                     in_progress:
 *                       type: number
 *                     completed:
 *                       type: number
 *                     cancelled:
 *                       type: number
 *                     rescheduled:
 *                       type: number
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /admin/dashboard/revenue-trend:
 *   get:
 *     tags:
 *       - Admin Dashboard (new)
 *     summary: Get revenue trend
 *     description: Get revenue data grouped by custom date range and time period (day/week/month/year)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date in YYYY-MM-DD format
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date in YYYY-MM-DD format
 *       - in: query
 *         name: groupBy
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - day
 *             - week
 *             - month
 *             - year
 *           default: day
 *         description: Time period grouping for revenue data
 *     responses:
 *       200:
 *         description: Revenue trend retrieved successfully
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
 *                     trend:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           period:
 *                             type: string
 *                           revenue:
 *                             type: number
 *                           jobCount:
 *                             type: number
 *                     dateRange:
 *                       type: object
 *                       properties:
 *                         startDate:
 *                           type: string
 *                           format: date-time
 *                         endDate:
 *                           type: string
 *                           format: date-time
 *                     groupBy:
 *                       type: string
 *       400:
 *         description: Invalid parameters (missing date range or invalid groupBy)
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /admin/dashboard/live-jobs:
 *   get:
 *     tags:
 *       - Admin Dashboard (new)
 *     summary: Get live job queue
 *     description: Get list of active jobs with customer, technician, and quotation details. Supports filtering by status and pagination.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - pending
 *             - assigned
 *             - in_progress
 *             - all
 *           default: all
 *         description: Filter jobs by status
 *       - in: query
 *         name: sortBy
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - createdAt
 *             - priority
 *           default: createdAt
 *         description: Sort order for jobs
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page (max 100)
 *     responses:
 *       200:
 *         description: Live job queue retrieved successfully
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
 *       400:
 *         description: Invalid status parameter
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /admin/dashboard/available-technicians:
 *   get:
 *     tags:
 *       - Admin Dashboard (new)
 *     summary: Get available technicians
 *     description: Get list of technicians currently available (status=available, not blacklisted, active). Sorted by rating and job completion.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page (max 100)
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *           default: Shivam
 *         description: get technicians by search with fullName
 *     responses:
 *       200:
 *         description: Available technicians retrieved successfully
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
 *                     properties:
 *                       _id:
 *                         type: string
 *                       technicianId:
 *                         type: string
 *                       fullName:
 *                         type: string
 *                       mobileNumber:
 *                         type: string
 *                       email:
 *                         type: string
 *                       averageRating:
 *                         type: number
 *                         format: float
 *                       totalJobsCompleted:
 *                         type: integer
 *                       totalEarnings:
 *                         type: number
 *                       yearsOfExperience:
 *                         type: integer
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
 * /admin/dashboard/quotation/{jobId}:
 *   get:
 *     tags:
 *       - Admin Dashboard (new)
 *     summary: Get quotation details for a job
 *     description: Get comprehensive job details including customer, technician, service details, and linked quotation with pricing breakdown
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Job quotation details retrieved successfully
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
 *                     jobId:
 *                       type: string
 *                     jobName:
 *                       type: string
 *                     status:
 *                       type: string
 *                     jobType:
 *                       type: string
 *                     customer:
 *                       type: object
 *                     technician:
 *                       type: object
 *                     serviceDetails:
 *                       type: array
 *                     quotation:
 *                       type: object
 *                     pricingBreakdown:
 *                       type: object
 *                     paymentStatus:
 *                       type: string
 *                     paymentTimeline:
 *                       type: object
 *                     jobTimeline:
 *                       type: array
 *       400:
 *         description: Invalid jobId format
 *       404:
 *         description: Job not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /admin/dashboard/refund-requests:
 *   get:
 *     tags:
 *       - Admin Dashboard (new)
 *     summary: Get refund requests
 *     description: Get list of jobs with refund status. Can filter by refund type (pending/completed/partial) and date range.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - pending
 *             - completed
 *             - partial
 *           default: completed
 *         description: Filter by refund status
 *       - in: query
 *         name: startDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering (YYYY-MM-DD format)
 *       - in: query
 *         name: endDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering (YYYY-MM-DD format)
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page (max 100)
 *     responses:
 *       200:
 *         description: Refund requests retrieved successfully
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
 *                     properties:
 *                       jobId:
 *                         type: string
 *                       jobName:
 *                         type: string
 *                       totalPrice:
 *                         type: number
 *                       paymentStatus:
 *                         type: string
 *                       customer:
 *                         type: object
 *                       quotation:
 *                         type: object
 *                       refundType:
 *                         type: string
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
 * Dashboard Statistics & Analytics Endpoints
 */

/**
 * GET /admin/dashboard/today-stats
 * Get today's statistics: total jobs, active jobs by status, active technicians
 * Response: { success, data: { totalJobsToday, activeJobs, activeTechnicians, timestamp } }
 */
router.get("/today-stats", authenticateAdmin, getTodayStats);

/**
 * GET /admin/dashboard/revenue-trend
 * Get revenue trend with custom date range and grouping
 * Query params:
 *   - startDate (required): ISO date string
 *   - endDate (required): ISO date string
 *   - groupBy (optional): "day" | "week" | "month" | "year" (default: "day")
 * Response: { success, data: { trend: Array, dateRange, groupBy } }
 */
router.get("/revenue-trend", authenticateAdmin, getRevenueTrend);

/**
 * GET /admin/dashboard/job-stats
 * Get job statistics: count of jobs by status
 * Response: { success, data: { pending, assigned, reached, in_progress, completed, cancelled, rescheduled } }
 */
router.get("/job-stats", authenticateAdmin, getJobStats);

/**
 * GET /admin/dashboard/live-jobs
 * Get live job queue with filtering and pagination
 * Query params:
 *   - status (optional): "pending" | "assigned" | "in_progress" | "all" (default: "all")
 *   - sortBy (optional): "createdAt" | "priority" (default: "createdAt")
 *   - page (optional): number >= 1 (default: 1)
 *   - limit (optional): number 1-100 (default: 10)
 * Response: { success, data: Array, pagination: { page, limit, total, pages } }
 */
router.get("/live-jobs", authenticateAdmin, getLiveJobQueue);

/**
 * GET /admin/dashboard/available-technicians
 * Get available technicians with pagination
 * Query params:
 *   - page (optional): number >= 1 (default: 1)
 *   - limit (optional): number 1-100 (default: 10)
 * Response: { success, data: Array, pagination: { page, limit, total, pages } }
 */
router.get("/available-technicians", authenticateAdmin, getAvailableTechnicians);

/**
 * GET /admin/dashboard/quotation/:jobId
 * Get quotation details for a specific job
 * Params:
 *   - jobId (required): MongoDB ObjectId
 * Response: { success, data: { job details with quotation breakdown } }
 */
router.get("/quotation/:jobId", authenticateAdmin, getQuotationDetails);

/**
 * GET /admin/dashboard/refund-requests
 * Get refund requests with filtering and pagination
 * Query params:
 *   - status (optional): "pending" | "completed" | "partial" (default: "completed")
 *   - startDate (optional): ISO date string
 *   - endDate (optional): ISO date string
 *   - page (optional): number >= 1 (default: 1)
 *   - limit (optional): number 1-100 (default: 10)
 * Response: { success, data: Array, pagination: { page, limit, total, pages } }
 */
router.get("/refund-requests", authenticateAdmin, getRefundRequests);

export default router;
