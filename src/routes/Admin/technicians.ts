import express from "express";
import { authenticateAdmin } from "../../middlewares/authorisation.js";
import {
    getAllTechnicians,
    getTechnicianDetails,
    approveTechnicianRegistration,
    rejectTechnicianRegistration,
    deactivateTechnician,
    verifyTechnicianDocuments,
    getTechnicianRatings,
    getStats,
    getList,
    processRegistration,
    toggleStatus,
    toggleAutoPickup,
    getTechnicianJobs,
    getJobDetail,
    getTechnicianPerformance,
} from "../../controllers/Admin/technicianController.js";

/**
 * @swagger
 * tags:
 *   - name: Admin Technicians
 *     description: Admin technician management endpoints
 */

/**
 * @swagger
 * /admin/technician:
 *   get:
 *     tags:
 *       - Admin Technicians
 *     summary: Get all technicians
 *     description: Retrieve list of all technicians with pagination
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by current status
 *       - in: query
 *         name: registrationStatus
 *         schema:
 *           type: string
 *         description: Filter by registration status
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
 *     responses:
 *       200:
 *         description: Technicians retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 technicians:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     current:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /admin/technician/{technicianId}:
 *   get:
 *     tags:
 *       - Admin Technicians
 *     summary: Get technician details
 *     description: Retrieve detailed information about a specific technician
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: technicianId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Technician details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 technician:
 *                   type: object
 *       404:
 *         description: Technician not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /admin/technician/{technicianId}/approve:
 *   post:
 *     tags:
 *       - Admin Technicians
 *     summary: Approve technician registration
 *     description: Approve a technician's registration application
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: technicianId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Technician approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 technician:
 *                   type: object
 *       404:
 *         description: Technician not found
 *       400:
 *         description: Documents not verified
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /admin/technician/{technicianId}/reject:
 *   post:
 *     tags:
 *       - Admin Technicians
 *     summary: Reject technician registration
 *     description: Reject a technician's registration application
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: technicianId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for rejection
 *             required:
 *               - reason
 *     responses:
 *       200:
 *         description: Technician rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 technician:
 *                   type: object
 *       400:
 *         description: Rejection reason required
 *       404:
 *         description: Technician not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /admin/technician/{technicianId}/deactivate:
 *   post:
 *     tags:
 *       - Admin Technicians
 *     summary: Deactivate technician
 *     description: Deactivate a technician's account
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: technicianId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Technician deactivated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Technician not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /admin/technician/{technicianId}/verify-document:
 *   post:
 *     tags:
 *       - Admin Technicians
 *     summary: Verify technician documents
 *     description: Verify technician's submitted documents (aadhaar, panCard, drivingLicense, vehicleRegistration, vehicleImage)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: technicianId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               documentType:
 *                 type: string
 *                 enum:
 *                   - aadhaar
 *                   - panCard
 *                   - drivingLicense
 *                   - vehicleRegistration
 *                   - vehicleImage
 *                 description: Type of document to verify
 *             required:
 *               - documentType
 *     responses:
 *       200:
 *         description: Document verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Document type invalid or not found
 *       404:
 *         description: Technician not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /admin/technician/{technicianId}/rating:
 *   get:
 *     tags:
 *       - Admin Technicians
 *     summary: Get technician ratings
 *     description: Retrieve rating and review information for a technician
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: technicianId
 *         required: true
 *         schema:
 *           type: string
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
 *     responses:
 *       200:
 *         description: Technician ratings retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 ratings:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     current:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /admin/technician/stats:
 *   get:
 *     tags:
 *       - Admin Technicians
 *     summary: Get technician statistics
 *     description: Retrieve dashboard statistics for technician management
 *     security:
 *       - cookieAuth: []
 *     parameters:
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
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /admin/technician/list:
 *   get:
 *     tags:
 *       - Admin Technicians
 *     summary: Get filtered technician list
 *     description: Retrieve unverified or verified technician lists with filters
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: listType
 *         schema:
 *           type: string
 *           enum: [unverified, verified]
 *           default: verified
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
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
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Technician list retrieved
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /admin/technician/{technicianId}/registration-action:
 *   post:
 *     tags:
 *       - Admin Technicians
 *     summary: Process technician registration (approve/reject consolidated)
 *     description: Approve or reject technician registration
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: technicianId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *               reason:
 *                 type: string
 *                 description: Required for reject action
 *             required:
 *               - action
 *     responses:
 *       200:
 *         description: Registration processed successfully
 *       400:
 *         description: Invalid action or missing fields
 *       404:
 *         description: Technician not found
 */

/**
 * @swagger
 * /admin/technician/{technicianId}/toggle-status:
 *   post:
 *     tags:
 *       - Admin Technicians
 *     summary: Toggle technician status (activate/deactivate consolidated)
 *     description: Activate or deactivate technician account
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: technicianId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [activate, deactivate]
 *             required:
 *               - action
 *     responses:
 *       200:
 *         description: Status toggled successfully
 *       400:
 *         description: Invalid action
 *       404:
 *         description: Technician not found
 */

/**
 * @swagger
 * /admin/technician/{technicianId}/settings/auto-pickup:
 *   post:
 *     tags:
 *       - Admin Technicians
 *     summary: Toggle auto job pickup setting
 *     description: Enable or disable automatic job pickup for technician
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: technicianId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enabled:
 *                 type: boolean
 *             required:
 *               - enabled
 *     responses:
 *       200:
 *         description: Auto pickup setting updated
 *       404:
 *         description: Technician not found
 */

/**
 * @swagger
 * /admin/technician/{technicianId}/jobs:
 *   get:
 *     tags:
 *       - Admin Technicians
 *     summary: Get technician's jobs
 *     description: Retrieve all jobs assigned to technician (return all, frontend filters by status)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: technicianId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *     responses:
 *       200:
 *         description: Jobs list retrieved
 *       404:
 *         description: Technician not found
 */

/**
 * @swagger
 * /admin/technician/{technicianId}/jobs/{jobId}:
 *   get:
 *     tags:
 *       - Admin Technicians
 *     summary: Get specific job details for technician
 *     description: Retrieve complete job information for a technician's assigned job
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: technicianId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job details retrieved
 *       404:
 *         description: Job not found
 */

/**
 * @swagger
 * /admin/technician/{technicianId}/performance:
 *   get:
 *     tags:
 *       - Admin Technicians
 *     summary: Get technician performance metrics
 *     description: Retrieve earnings, ratings, completed jobs and performance stats
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: technicianId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Performance metrics retrieved
 *       404:
 *         description: Technician not found
 */

const router = express.Router();

router.get("/", authenticateAdmin, getAllTechnicians);
router.get("/stats", authenticateAdmin, getStats);
router.get("/list", authenticateAdmin, getList);
router.get("/:technicianId", authenticateAdmin, getTechnicianDetails);
router.get("/:technicianId/performance", authenticateAdmin, getTechnicianPerformance);
router.get("/:technicianId/jobs", authenticateAdmin, getTechnicianJobs);
router.get("/:technicianId/jobs/:jobId", authenticateAdmin, getJobDetail);
router.get("/:technicianId/rating", authenticateAdmin, getTechnicianRatings);
router.post("/:technicianId/registration-action", authenticateAdmin, processRegistration);
router.post("/:technicianId/approve", authenticateAdmin, approveTechnicianRegistration);
router.post("/:technicianId/reject", authenticateAdmin, rejectTechnicianRegistration);
router.post("/:technicianId/toggle-status", authenticateAdmin, toggleStatus);
router.post("/:technicianId/deactivate", authenticateAdmin, deactivateTechnician);
router.post("/:technicianId/verify-document", authenticateAdmin, verifyTechnicianDocuments);
router.post("/:technicianId/settings/auto-pickup", authenticateAdmin, toggleAutoPickup);
router.post("/:technicianId/rating", authenticateAdmin, getTechnicianRatings);

export default router;
