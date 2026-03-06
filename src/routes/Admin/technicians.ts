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

const router = express.Router();

router.get("/", authenticateAdmin, getAllTechnicians);
router.get("/:technicianId", authenticateAdmin, getTechnicianDetails);
router.post("/:technicianId/approve", authenticateAdmin, approveTechnicianRegistration);
router.post("/:technicianId/reject", authenticateAdmin, rejectTechnicianRegistration);
router.post("/:technicianId/deactivate", authenticateAdmin, deactivateTechnician);
router.post("/:technicianId/verify-document", authenticateAdmin, verifyTechnicianDocuments);
router.get("/:technicianId/rating", authenticateAdmin, getTechnicianRatings);

export default router;
