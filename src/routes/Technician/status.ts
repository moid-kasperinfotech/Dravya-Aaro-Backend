import express from "express";
import { authenticateTechnician } from "../../middlewares/authorisation.js";
import {
  toggleStatus,
  getStatus,
} from "../../controllers/Technician/authController.js";

/**
 * @swagger
 * tags:
 *   - name: Technician Status & Dashboard (new)
 *     description: Technician on-duty/off-duty and dashboard endpoints
 */

/**
 * @swagger
 * /technician/status/toggle:
 *   post:
 *     tags:
 *       - Technician Status & Dashboard (new)
 *     summary: Toggle on-duty/off-duty status
 *     description: Toggle technician between on-duty and off-duty status. When off-duty, technician will not receive job notifications.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Status toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Status updated to on-duty"
 *                 offDuty:
 *                   type: boolean
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Technician not found
 */

/**
 * @swagger
 * /technician/status:
 *   get:
 *     tags:
 *       - Technician Status & Dashboard (new)
 *     summary: Get on-duty/off-duty status
 *     description: Get current on-duty/off-duty status of the technician
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 offDuty:
 *                   type: boolean
 *                 status:
 *                   type: string
 *                   enum: ["on-duty", "off-duty"]
 *                   description: Current duty status (on-duty=available for jobs, off-duty=not available)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Technician not found

 */

const router = express.Router();

router.post("/toggle", authenticateTechnician, toggleStatus);
router.get("/", authenticateTechnician, getStatus);

export default router;
