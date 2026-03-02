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
 *         name: skip
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Technicians retrieved successfully
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
 *       404:
 *         description: Technician not found
 *       401:
 *         description: Unauthorized
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
 *     responses:
 *       200:
 *         description: Technician rejected successfully
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
 *     description: Verify technician's submitted documents
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
 *               verified:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Document verified
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
 *     responses:
 *       200:
 *         description: Technician ratings retrieved
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
